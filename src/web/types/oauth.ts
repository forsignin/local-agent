export type OAuthProvider = 'github' | 'google' | 'wechat';

export interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string[];
  authUrl: string;
}

export interface OAuthResponse {
  provider: OAuthProvider;
  code: string;
  state?: string;
}

export interface OAuthUserInfo {
  id: string;
  provider: OAuthProvider;
  email: string;
  name: string;
  avatar?: string;
  accessToken: string;
}

export interface OAuthState {
  loading: boolean;
  error: string | null;
  providers: OAuthProvider[];
  userInfo: OAuthUserInfo | null;
}