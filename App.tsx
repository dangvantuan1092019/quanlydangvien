
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import LoginScreen from './components/LoginScreen';
import MemberForm from './components/MemberForm';
import MemberList from './components/MemberList';
import Dashboard from './components/Dashboard';
import { UserPlusIcon, ListIcon, ChartIcon, LogoutIcon, CheckCircleIcon, LoadingSpinner, ExclamationCircleIcon, UploadIcon, DownloadIcon, GoogleDriveIcon } from './components/icons';
import type { PartyMember, AppView } from './types';

// Extend the Window interface for Google APIs
declare global {
    interface Window {
        gapi: any;
        google: any;
    }
}

const App: React.FC = () => {
    // App State
    const [members, setMembers] = useState<PartyMember[]>(() => {
        try {
            const savedMembers = localStorage.getItem('partyMembers');
            return savedMembers ? JSON.parse(savedMembers) : [];
        } catch (error) {
            console.error("Không thể tải dữ liệu Đảng viên từ localStorage", error);
            return [];
        }
    });
    const [currentView, setCurrentView] = useState<AppView>('list');
    const [editingMember, setEditingMember] = useState<PartyMember | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
    const [loadConfirmation, setLoadConfirmation] = useState<{data: PartyMember[], source: 'local' | 'drive' } | null>(null);

    // Google Auth & API State
    const [userProfile, setUserProfile] = useState<any>(null);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [isGapiLoaded, setIsGapiLoaded] = useState(false);
    const driveFileIdRef = useRef<string | null>(localStorage.getItem('driveFileId'));
    const loadFileRef = useRef<HTMLInputElement>(null);

    const DRIVE_FILE_NAME = 'dang-vien-data.json';
    const SCOPES = 'https://www.googleapis.com/auth/drive.file';

    // --- GOOGLE API INITIALIZATION ---
    useEffect(() => {
        const gapiScript = document.getElementsByTagName('script')[2];
        gapiScript.onload = () => window.gapi.load('client', initializeGapiClient);

        const gsiScript = document.getElementsByTagName('script')[1];
        gsiScript.onload = initializeGsiClient;
    }, []);

    const initializeGapiClient = useCallback(async () => {
        if (!process.env.API_KEY) {
            console.error("API_KEY is not configured.");
            alert("Lỗi cấu hình: API_KEY của Google chưa được thiết lập.");
            return;
        }
        await window.gapi.client.init({
            apiKey: process.env.API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        });
        setIsGapiLoaded(true);
    }, []);

    const initializeGsiClient = useCallback(() => {
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("GOOGLE_CLIENT_ID is not configured.");
            alert("Lỗi cấu hình: GOOGLE_CLIENT_ID chưa được thiết lập.");
            return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: process.env.GOOGLE_CLIENT_ID,
            scope: SCOPES,
            callback: async (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    const profile = await fetchUserProfile(tokenResponse.access_token);
                    setUserProfile(profile);
                }
            },
        });
        setTokenClient(client);
    }, []);
    
    // --- AUTHENTICATION ---
    const fetchUserProfile = async (token: string) => {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.json();
    };
    
    const handleGoogleLogin = () => {
        if (tokenClient) {
            tokenClient.requestAccessToken();
        }
    };
    
    const handleLogout = () => {
        const token = window.gapi.client.getToken();
        if (token) {
            window.google.accounts.oauth2.revoke(token.access_token, () => {});
            window.gapi.client.setToken(null);
        }
        setUserProfile(null);
        driveFileIdRef.current = null;
        localStorage.removeItem('driveFileId');
    };

    // --- DATA PERSISTENCE ---
    useEffect(() => {
        try {
            localStorage.setItem('partyMembers', JSON.stringify(members));
        } catch (error) {
            console.error("Không thể lưu dữ liệu vào localStorage", error);
        }
    }, [members]);
    
    useEffect(() => {
        if (saveStatus !== 'idle') {
            const timer = setTimeout(() => setSaveStatus('idle'), 3000);
            return () => clearTimeout(timer);
        }
    }, [saveStatus]);

    // --- GOOGLE DRIVE LOGIC ---
    const findOrCreateFile = async (): Promise<string | null> => {
        if (driveFileIdRef.current) return driveFileIdRef.current;
        try {
            const res = await window.gapi.client.drive.files.list({
                q: `name='${DRIVE_FILE_NAME}' and trashed=false`,
                spaces: 'drive',
                fields: 'files(id, name)',
            });
            if (res.result.files.length > 0) {
                const fileId = res.result.files[0].id;
                driveFileIdRef.current = fileId;
                localStorage.setItem('driveFileId', fileId);
                return fileId;
            } else {
                const fileMetadata = { name: DRIVE_FILE_NAME, parents: ['root'] };
                const createRes = await window.gapi.client.drive.files.create({ resource: fileMetadata });
                const fileId = createRes.result.id;
                driveFileIdRef.current = fileId;
                localStorage.setItem('driveFileId', fileId);
                return fileId;
            }
        } catch (error) {
            console.error("Lỗi khi tìm hoặc tạo file trên Drive:", error);
            return null;
        }
    };

    const saveToDrive = async () => {
        setSaveStatus('saving');
        const fileId = await findOrCreateFile();
        if (!fileId) {
            setSaveStatus('failed');
            alert("Không thể tìm hoặc tạo file trên Google Drive.");
            return;
        }
        const boundary = '-------314159265358979323846';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";
        const metadata = { name: DRIVE_FILE_NAME, mimeType: 'application/json' };
        const multipartRequestBody =
            delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) +
            delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(members) +
            close_delim;
        try {
            await window.gapi.client.request({
                path: `/upload/drive/v3/files/${fileId}`,
                method: 'PATCH',
                params: { uploadType: 'multipart' },
                headers: { 'Content-Type': 'multipart/related; boundary="' + boundary + '"' },
                body: multipartRequestBody,
            });
            setSaveStatus('saved');
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu lên Drive:", error);
            setSaveStatus('failed');
            alert("Lưu dữ liệu lên Google Drive thất bại.");
        }
    };
    
    const loadFromDrive = async () => {
        const fileId = await findOrCreateFile(); // Use find to avoid creating an empty file on load attempt
        if (!fileId) {
            alert("Không tìm thấy file dữ liệu trên Google Drive.");
            return;
        }
        try {
            const res = await window.gapi.client.drive.files.get({
                fileId: fileId,
                alt: 'media',
            });
            if(res.result && Array.isArray(res.result)) {
                setLoadConfirmation({ data: res.result, source: 'drive' });
            } else {
                alert("File dữ liệu trên Google Drive trống hoặc không hợp lệ.");
            }
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu từ Drive:", error);
            alert("Tải dữ liệu từ Google Drive thất bại.");
        }
    };
    
    // --- LOCAL FILE HANDLING ---
    const handleSaveDataToFile = () => {
        if (members.length === 0) {
            alert("Không có dữ liệu để lưu.");
            return;
        }
        const jsonString = JSON.stringify(members, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `du-lieu-dang-vien-${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleLoadDataFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result as string);
                if (Array.isArray(data)) {
                    setLoadConfirmation({ data, source: 'local' });
                } else { throw new Error("File JSON phải chứa một mảng dữ liệu."); }
            } catch (error) {
                alert(`Lỗi xử lý file: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
            } finally {
                if (loadFileRef.current) { loadFileRef.current.value = ''; }
            }
        };
        reader.readAsText(file);
    };

    const confirmLoadData = () => {
        if (loadConfirmation) {
            setMembers(loadConfirmation.data);
            setLoadConfirmation(null);
            alert("Đã tải dữ liệu thành công!");
            setCurrentView('list');
        }
    };

    // --- CORE APP LOGIC ---
    const addMember = useCallback((member: PartyMember) => {
        setMembers(prev => [...prev, member]);
        alert('Thêm Đảng viên thành công!');
        setCurrentView('list');
    }, []);
    
    const addMultipleMembers = useCallback((newMembers: PartyMember[]) => {
        setMembers(prev => [...prev, ...newMembers]);
        alert(`Đã nhập thành công ${newMembers.length} Đảng viên!`);
        setCurrentView('list');
    }, []);

    const updateMember = useCallback((updatedMember: PartyMember) => {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
        setEditingMember(null);
        setCurrentView('list');
        alert('Cập nhật thông tin thành công!');
    }, []);

    const deleteMember = useCallback((id: string) => {
        setMembers(prev => prev.filter(m => m.id !== id));
        alert('Đã xóa Đảng viên thành công.');
    }, []);

    const startEdit = useCallback((member: PartyMember) => {
        setEditingMember(member);
        setCurrentView('form');
    }, []);

    const cancelEdit = useCallback(() => {
        setEditingMember(null);
        setCurrentView('list');
    }, []);

    const navItems = useMemo(() => [
        { id: 'form', label: 'Thêm Hồ sơ', icon: UserPlusIcon },
        { id: 'list', label: 'Danh sách', icon: ListIcon },
        { id: 'dashboard', label: 'Thống kê', icon: ChartIcon },
    ], []);

    if (!userProfile) {
        return <LoginScreen onLogin={handleGoogleLogin} isReady={isGapiLoaded && !!tokenClient} />;
    }
    
    const SaveStatusIndicator = () => {
        switch(saveStatus) {
            case 'saving': return <div className="flex items-center text-gray-300"><LoadingSpinner className="h-5 w-5 mr-2 animate-spin" /><span>Đang lưu...</span></div>;
            case 'saved': return <div className="flex items-center text-brand-gold"><CheckCircleIcon className="h-5 w-5 mr-2" /><span className="font-semibold">Đã lưu vào Drive!</span></div>;
            case 'failed': return <div className="flex items-center text-red-300"><ExclamationCircleIcon className="h-5 w-5 mr-2" /><span className="font-semibold">Lưu thất bại!</span></div>;
            default: return null;
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-brand-red shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <h1 className="text-2xl font-bold text-white">Quản Lý Hồ Sơ Đảng Viên</h1>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center text-sm text-white h-6 min-w-[150px] justify-center"><SaveStatusIndicator /></div>
                            <button onClick={loadFromDrive} title="Tải dữ liệu từ Google Drive" className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150"><GoogleDriveIcon className="h-6 w-6" /></button>
                            <button onClick={saveToDrive} title="Lưu dữ liệu vào Google Drive" className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150"><GoogleDriveIcon className="h-6 w-6" /></button>
                            <input type="file" ref={loadFileRef} onChange={handleLoadDataFromFile} className="hidden" accept=".json" />
                            <button onClick={() => loadFileRef.current?.click()} title="Tải dữ liệu từ file local" className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150"><UploadIcon className="h-6 w-6" /></button>
                            <button onClick={handleSaveDataToFile} title="Lưu dữ liệu ra file local" className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150"><DownloadIcon className="h-6 w-6" /></button>
                            <div className="flex items-center space-x-3 pl-2 border-l border-white/30">
                                <img src={userProfile.picture} alt="Avatar" className="h-9 w-9 rounded-full" />
                                <span className="text-white font-medium hidden md:block">{userProfile.name}</span>
                                <button onClick={handleLogout} className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150" title="Đăng xuất"><LogoutIcon className="h-6 w-6" /></button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <nav className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center space-x-4">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { if (item.id === 'form') setEditingMember(null); setCurrentView(item.id as AppView); }}
                                className={`flex items-center px-4 py-3 border-b-4 text-sm font-medium transition duration-150 ease-in-out ${currentView === item.id ? 'border-brand-red text-brand-red' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                            >
                                <item.icon className="h-5 w-5 mr-2" />{item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>
            
            <main className="py-10"><div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                {currentView === 'form' && <MemberForm addMember={addMember} editingMember={editingMember} updateMember={updateMember} onCancelEdit={cancelEdit} />}
                {currentView === 'list' && <MemberList members={members} addMultipleMembers={addMultipleMembers} onEdit={startEdit} onDelete={deleteMember} />}
                {currentView === 'dashboard' && <Dashboard members={members} />}
            </div></main>

            {loadConfirmation && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100"><ExclamationCircleIcon className="h-6 w-6 text-yellow-600" /></div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Xác nhận tải dữ liệu</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">Hành động này sẽ <span className="font-bold text-red-600">thay thế toàn bộ</span> dữ liệu hiện tại bằng dữ liệu từ {loadConfirmation.source === 'drive' ? 'Google Drive' : 'file đã chọn'}. Bạn có chắc chắn muốn tiếp tục không?</p>
                            </div>
                            <div className="items-center px-4 py-3 space-x-4">
                                <button onClick={() => setLoadConfirmation(null)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none">Hủy bỏ</button>
                                <button onClick={confirmLoadData} className="px-4 py-2 bg-brand-red text-white rounded-md hover:bg-brand-red-dark focus:outline-none">Xác nhận</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
