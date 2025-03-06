import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { ToolProvider } from './context/ToolContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import OAuthCallback from './pages/OAuthCallback';
import PrivateRoute from './components/auth/PrivateRoute';
import { setAllowToolApiCalls } from './services/api';

const App: React.FC = () => {
  const location = useLocation();
  
  // 根据当前路径决定是否允许工具相关的 API 调用
  useEffect(() => {
    const isLoginPage = location.pathname === '/login' || 
                        location.pathname === '/register' || 
                        location.pathname.startsWith('/oauth/callback');
    
    // 只有在非登录页面才允许工具相关的 API 调用
    setAllowToolApiCalls(!isLoginPage);
  }, [location.pathname]);

  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <AppProvider>
          <ToolProvider shouldLoad={false}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/oauth/callback/:provider" element={<OAuthCallback />} />
              <Route
                path="/*"
                element={
                  <PrivateRoute>
                    <MainLayout />
                  </PrivateRoute>
                }
              />
            </Routes>
          </ToolProvider>
        </AppProvider>
      </AuthProvider>
    </ConfigProvider>
  );
};

export default App; 