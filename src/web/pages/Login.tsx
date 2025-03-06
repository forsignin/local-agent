import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, Space, Divider, message } from 'antd';
import type { FormProps } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials } from '../types/auth';
import OAuthButtons from '../components/auth/OAuthButtons';
import logo from '../assets/logo.svg';

const { Title } = Typography;

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f0f2f5;
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  padding: 40px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.img`
  width: 200px;
  margin-bottom: 24px;
`;

const StyledForm = styled(Form)<FormProps>`
  .ant-form-item {
    margin-bottom: 24px;
  }
`;

const OAuthButton = styled(Button)`
  width: 100%;
  margin-bottom: 16px;
`;

const Footer = styled.div`
  text-align: center;
  margin-top: 24px;
`;

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm<LoginFormValues>();

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      await login(values.username, values.password);
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from);
    } catch (error) {
      console.error('登录失败:', error);
      message.error('登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthStart = () => {
    setLoading(true);
  };

  const handleOAuthComplete = () => {
    setLoading(false);
  };

  const handleOAuthError = (error: Error) => {
    setLoading(false);
    message.error('第三方登录失败，请重试');
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Logo src={logo} alt="LocalAgent" />
        <StyledForm
          form={form}
          name="login"
          onFinish={handleSubmit}
          initialValues={{ remember: true }}
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link to="/forgot-password" style={{ float: 'right' }}>
              忘记密码？
            </Link>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </StyledForm>

        <div style={{ textAlign: 'center', margin: '24px 0' }}>
          或使用第三方账号登录
        </div>

        <OAuthButtons
          onStart={handleOAuthStart}
          onComplete={handleOAuthComplete}
          onError={handleOAuthError}
        />

        <Footer>
          还没有账号？ <Link to="/register">立即注册</Link>
        </Footer>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;