
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import MemberForm from './components/MemberForm';
import MemberList from './components/MemberList';
import Dashboard from './components/Dashboard';
import { UserPlusIcon, ListIcon, ChartIcon, LogoutIcon, CheckCircleIcon, LoadingSpinner, ExclamationCircleIcon } from './components/icons';
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

  useEffect(() => {
    // The check to skip the initial save has been removed to make saving more reliable.
    // This may cause a brief "Saving..." message on startup, but it ensures all changes are persisted correctly.
    setSaveStatus('saving');
    const saveTimer = setTimeout(() => {
        try {
            localStorage.setItem('partyMembers', JSON.stringify(members));
            setSaveStatus('saved');
        } catch (error) {
            console.error("Không thể lưu dữ liệu Đảng viên vào localStorage", error);
            setSaveStatus('failed');
        }
    }, 50);

    return () => {
        clearTimeout(saveTimer);
    };
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
                <div className="flex items-center text-sm text-white h-6 w-32">
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
    </div>
  );
};

export default App;
