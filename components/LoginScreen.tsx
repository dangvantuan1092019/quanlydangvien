
import React from 'react';
import { GoogleIcon } from './icons';

interface LoginScreenProps {
  onLogin: () => void;
  isReady: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isReady }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-2xl text-center">
        <div>
          <h1 className="text-3xl font-bold text-brand-red mb-4">QUẢN LÝ HỒ SƠ ĐẢNG VIÊN</h1>
        </div>
        
        <p className="mt-2 text-gray-600">Vui lòng đăng nhập bằng tài khoản Google để tiếp tục</p>
        <div className="pt-2">
            <button
            onClick={onLogin}
            disabled={!isReady}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
            <GoogleIcon className="h-6 w-6 mr-3" />
            Đăng nhập với Google
            </button>
            {!isReady && <p className="text-xs text-gray-500 mt-2 animate-pulse">Đang tải dịch vụ của Google...</p>}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;