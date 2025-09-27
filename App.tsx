
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import LoginScreen from './components/LoginScreen';
import MemberForm from './components/MemberForm';
import MemberList from './components/MemberList';
import Dashboard from './components/Dashboard';
import { UserPlusIcon, ListIcon, ChartIcon, LogoutIcon, CheckCircleIcon, LoadingSpinner, ExclamationCircleIcon, UploadIcon, DownloadIcon } from './components/icons';
import type { PartyMember, AppView } from './types';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [members, setMembers] = useState<PartyMember[]>(() => {
    try {
      const savedMembers = localStorage.getItem('partyMembers');
      return savedMembers ? JSON.parse(savedMembers) : [];
    } catch (error) {
      console.error("Không thể tải dữ liệu Đảng viên từ localStorage", error);
      return [];
    }
  });
  const [currentView, setCurrentView] = useState<AppView>('form');
  const [editingMember, setEditingMember] = useState<PartyMember | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [loadConfirmation, setLoadConfirmation] = useState<PartyMember[] | null>(null);
  
  const isInitialMount = useRef(true);
  const loadFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSaveStatus('saving');
    try {
        localStorage.setItem('partyMembers', JSON.stringify(members));
        const timer = setTimeout(() => setSaveStatus('saved'), 100);
        return () => clearTimeout(timer);
    } catch (error) {
        console.error("Không thể lưu dữ liệu Đảng viên vào localStorage", error);
        setSaveStatus('failed');
    }
  }, [members]);
  
  useEffect(() => {
      if (saveStatus === 'saved' || saveStatus === 'failed') {
          const duration = saveStatus === 'saved' ? 2000 : 5000;
          const timer = setTimeout(() => {
              setSaveStatus('idle');
          }, duration);
          return () => clearTimeout(timer);
      }
  }, [saveStatus]);

  const handleLoginSuccess = useCallback(() => {
    setIsLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setIsLoggedIn(false);
  }, []);

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

  const handleSaveDataToFile = () => {
    if (members.length === 0) {
        alert("Không có dữ liệu để lưu.");
        return;
    }
    try {
        const jsonString = JSON.stringify(members, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const date = new Date().toISOString().slice(0, 10);
        link.download = `du-lieu-dang-vien-${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Lỗi khi lưu dữ liệu:", error);
        alert("Đã xảy ra lỗi khi lưu dữ liệu.");
    }
  };

  const handleLoadDataFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error("Không thể đọc file.");
              }
              const data = JSON.parse(text);
              if (Array.isArray(data)) {
                  setLoadConfirmation(data);
              } else {
                  throw new Error("File JSON không hợp lệ. Dữ liệu phải là một mảng các Đảng viên.");
              }
          } catch (error) {
              console.error("Lỗi khi tải dữ liệu:", error);
              alert(`Đã xảy ra lỗi khi xử lý file: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
          } finally {
              if (loadFileRef.current) {
                  loadFileRef.current.value = '';
              }
          }
      };
      reader.readAsText(file);
  };

  const confirmLoadData = () => {
      if (loadConfirmation) {
          setMembers(loadConfirmation);
          setLoadConfirmation(null);
          alert("Đã tải dữ liệu thành công!");
          setCurrentView('list');
      }
  };

  const cancelLoadData = () => {
      setLoadConfirmation(null);
  };

  const navItems = useMemo(() => [
    { id: 'form', label: 'Thêm Hồ sơ', icon: UserPlusIcon },
    { id: 'list', label: 'Danh sách', icon: ListIcon },
    { id: 'dashboard', label: 'Thống kê', icon: ChartIcon },
  ], []);
  
  const handleSetView = (view: AppView) => {
    if (view === 'form' && editingMember) {
        setEditingMember(null);
    }
    setCurrentView(view);
  }

  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-brand-red shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">
                Hệ Thống Quản Lý Hồ Sơ Đảng Viên
              </h1>
            </div>
            <div className="flex items-center space-x-6">
                <div className="flex items-center text-sm text-white h-6 min-w-32">
                    {saveStatus === 'saving' && (
                        <div className="flex items-center text-gray-300">
                            <LoadingSpinner className="h-5 w-5 mr-2 animate-spin" />
                            <span>Đang lưu...</span>
                        </div>
                    )}
                    {saveStatus === 'saved' && (
                        <div className="flex items-center text-brand-gold">
                            <CheckCircleIcon className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Đã lưu!</span>
                        </div>
                    )}
                    {saveStatus === 'failed' && (
                        <div className="flex items-center text-red-300">
                            <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                            <span className="font-semibold">Lưu thất bại!</span>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={loadFileRef}
                    onChange={handleLoadDataFromFile}
                    className="hidden"
                    accept=".json"
                />
                <button
                    onClick={() => loadFileRef.current?.click()}
                    className="flex items-center text-white hover:text-brand-gold transition duration-150"
                    title="Tải dữ liệu từ file JSON"
                >
                    <UploadIcon className="h-6 w-6 mr-2" />
                    Tải dữ liệu
                </button>
                <button
                    onClick={handleSaveDataToFile}
                    className="flex items-center text-white hover:text-brand-gold transition duration-150"
                    title="Lưu toàn bộ dữ liệu ra file JSON"
                >
                    <DownloadIcon className="h-5 w-5 mr-2" />
                    Lưu dữ liệu
                </button>

                <button onClick={handleLogout} className="flex items-center text-white hover:text-brand-gold transition duration-150">
                    <LogoutIcon className="h-6 w-6 mr-2" />
                    Đăng xuất
                </button>
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
                        onClick={() => handleSetView(item.id as AppView)}
                        className={`flex items-center px-4 py-3 border-b-4 text-sm font-medium transition duration-150 ease-in-out ${
                            currentView === item.id 
                            ? 'border-brand-red text-brand-red' 
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <item.icon className="h-5 w-5 mr-2" />
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
      </nav>
      
      <main className="py-10">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          {currentView === 'form' && (
            <MemberForm 
                addMember={addMember} 
                editingMember={editingMember}
                updateMember={updateMember}
                onCancelEdit={cancelEdit}
            />
          )}
          {currentView === 'list' && (
            <MemberList 
                members={members} 
                addMultipleMembers={addMultipleMembers}
                onEdit={startEdit}
                onDelete={deleteMember}
            />
          )}
          {currentView === 'dashboard' && <Dashboard members={members} />}
        </div>
      </main>

      {loadConfirmation && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                <ExclamationCircleIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-4">Xác nhận tải dữ liệu</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Hành động này sẽ <span className="font-bold text-red-600">thay thế toàn bộ</span> dữ liệu hiện tại bằng dữ liệu từ file bạn chọn. Bạn có chắc chắn muốn tiếp tục không?
                </p>
              </div>
              <div className="items-center px-4 py-3 space-x-4">
                <button
                  onClick={cancelLoadData}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={confirmLoadData}
                  className="px-4 py-2 bg-brand-red text-white rounded-md hover:bg-brand-red-dark focus:outline-none"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
    )}
    </div>
  );
};

export default App;
