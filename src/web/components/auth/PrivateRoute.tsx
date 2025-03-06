import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import AppProviders from '../providers/AppProviders';
import { setAllowToolApiCalls } from '../../services/api';

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const { state } = useAuth();
  const location = useLocation();

  // 当认证状态变化时，更新是否允许工具相关的 API 调用
  useEffect(() => {
    // 只有在用户已认证时才允许工具相关的 API 调用
    setAllowToolApiCalls(state.isAuthenticated);
  }, [state.isAuthenticated]);

  if (state.loading) {
    return (
      <LoadingContainer>
        <Spin size="large" tip="加载中..." />
      </LoadingContainer>
    );
  }

  if (!state.isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && state.user && !requiredRole.includes(state.user.role)) {
    return <Navigate to="/403" replace />;
  }

  // 只有在用户已认证时才渲染 AppProviders
  return <AppProviders>{children}</AppProviders>;
};

export default PrivateRoute;