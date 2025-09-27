
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import MemberForm from './components/MemberForm';
import MemberList from './components/MemberList';
import Dashboard from './components/Dashboard';
import { UserPlusIcon, ListIcon, ChartIcon, UploadIcon, DownloadIcon, ExclamationCircleIcon } from './components/icons';
import type { PartyMember, AppView } from './types';


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
    const [loadConfirmation, setLoadConfirmation] = useState<{data: PartyMember[] } | null>(null);
    const loadFileRef = useRef<HTMLInputElement>(null);

    // --- DATA PERSISTENCE ---
    useEffect(() => {
        try {
            localStorage.setItem('partyMembers', JSON.stringify(members));
        } catch (error) {
            console.error("Không thể lưu dữ liệu vào localStorage", error);
        }
    }, [members]);
    
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
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                    setLoadConfirmation({ data });
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

    return (
        <div className="min-h-screen bg-gray-100">
            <header className="bg-brand-red shadow-md sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <h1 className="text-2xl font-bold text-white">Quản Lý Hồ Sơ Đảng Viên</h1>
                        <div className="flex items-center space-x-2">
                            <input type="file" ref={loadFileRef} onChange={handleLoadDataFromFile} className="hidden" accept=".json" />
                            <button onClick={() => loadFileRef.current?.click()} title="Tải dữ liệu từ file JSON" className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150"><UploadIcon className="h-6 w-6" /></button>
                            <button onClick={handleSaveDataToFile} title="Lưu dữ liệu ra file JSON" className="p-2 text-white rounded-full hover:bg-brand-red-dark transition duration-150"><DownloadIcon className="h-6 w-6" /></button>
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
                                <p className="text-sm text-gray-500">Hành động này sẽ <span className="font-bold text-red-600">thay thế toàn bộ</span> dữ liệu hiện tại bằng dữ liệu từ file đã chọn. Bạn có chắc chắn muốn tiếp tục không?</p>
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