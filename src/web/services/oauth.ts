import api from './api';
import type { OAuthProvider, OAuthConfig, OAuthResponse, OAuthUserInfo } from '../types/oauth';

const oauthConfigs: Record<OAuthProvider, OAuthConfig> = {
  github: {
    clientId: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/github/callback`,
    scope: ['user:email'],
    authUrl: 'https://github.com/login/oauth/authorize',
  },
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/google/callback`,
    scope: ['profile', 'email'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  },
  wechat: {
    clientId: process.env.REACT_APP_WECHAT_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/oauth/wechat/callback`,
    scope: ['snsapi_userinfo'],
    authUrl: 'https://open.weixin.qq.com/connect/qrconnect',
  },
};

export const getOAuthUrl = (provider: OAuthProvider): string => {
  const config = oauthConfigs[provider];
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope.join(' '),
    response_type: 'code',
    state: generateState(),
  });

  return `${config.authUrl}?${params.toString()}`;
};

export const handleOAuthCallback = async (
  provider: OAuthProvider,
  code: string,
  state?: string
): Promise<OAuthUserInfo> => {
  const response = await api.post('/auth/oauth/callback', {
    provider,
    code,
    state,
  });
  return response.data;
};

export const linkOAuthAccount = async (
  provider: OAuthProvider,
  code: string
): Promise<void> => {
  await api.post('/auth/oauth/link', {
    provider,
    code,
  });
};

export const unlinkOAuthAccount = async (
  provider: OAuthProvider
): Promise<void> => {
  await api.post('/auth/oauth/unlink', {
    provider,
  });
};

export const getLinkedAccounts = async (): Promise<OAuthProvider[]> => {
  const response = await api.get('/auth/oauth/accounts');
  return response.data;
};

// 生成随机state用于防止CSRF攻击
const generateState = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};