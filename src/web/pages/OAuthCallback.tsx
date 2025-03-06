import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { handleOAuthCallback } from '../services/oauth';
import type { OAuthProvider } from '../types/oauth';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { provider } = useParams<{ provider: OAuthProvider }>();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        message.error('授权失败，请重试');
        navigate('/login');
        return;
      }

      if (!code || !provider) {
        message.error('无效的回调参数');
        navigate('/login');
        return;
      }

      try {
        const userInfo = await handleOAuthCallback(provider, code, state || undefined);
        // 使用OAuth用户信息进行登录
        await login(userInfo.email, userInfo.accessToken || '');
        message.success('登录成功');
        navigate('/dashboard');
      } catch (error) {
        console.error('OAuth callback failed:', error);
        message.error('登录失败，请重试');
        navigate('/login');
      }
    };

    handleCallback();
  }, [provider, searchParams, navigate, login]);

  return (
    <Container>
      <Spin size="large" tip="正在处理登录..." />
    </Container>
  );
};

export default OAuthCallback; 