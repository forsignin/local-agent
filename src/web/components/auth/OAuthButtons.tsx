import React from 'react';
import { Button, Space } from 'antd';
import { GithubOutlined, GoogleOutlined, WechatOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { getOAuthUrl } from '../../services/oauth';
import type { OAuthProvider } from '../../types/oauth';

const StyledButton = styled(Button)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const providerConfig = {
  github: {
    icon: <GithubOutlined />,
    text: 'GitHub登录',
    color: '#24292e',
  },
  google: {
    icon: <GoogleOutlined />,
    text: 'Google登录',
    color: '#4285f4',
  },
  wechat: {
    icon: <WechatOutlined />,
    text: '微信登录',
    color: '#07c160',
  },
};

interface OAuthButtonsProps {
  onStart?: () => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

const OAuthButtons: React.FC<OAuthButtonsProps> = ({
  onStart,
  onComplete,
  onError,
}) => {
  const handleOAuthLogin = (provider: OAuthProvider) => {
    try {
      onStart?.();
      const url = getOAuthUrl(provider);
      window.location.href = url;
      onComplete?.();
    } catch (error) {
      console.error('OAuth login failed:', error);
      onError?.(error as Error);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {(Object.keys(providerConfig) as OAuthProvider[]).map((provider) => {
        const config = providerConfig[provider];
        return (
          <StyledButton
            key={provider}
            icon={config.icon}
            onClick={() => handleOAuthLogin(provider)}
            style={{ backgroundColor: config.color, color: '#fff' }}
          >
            {config.text}
          </StyledButton>
        );
      })}
    </Space>
  );
};

export default OAuthButtons; 