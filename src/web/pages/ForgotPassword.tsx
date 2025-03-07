import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { forgotPassword } from '../services/auth';

const { Title, Text } = Typography;

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f2f5;
`;

const StyledCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const LogoContainer = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Logo = styled.img`
  height: 48px;
  margin-bottom: 16px;
`;

const ForgotPassword: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (values: { email: string }) => {
    setLoading(true);
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (error) {
      console.error('Failed to send reset email:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <StyledCard>
        <LogoContainer>
          <Logo src="/static/images/logo.png" alt="LocalAgent" />
          <Title level={3}>重置密码</Title>
        </LogoContainer>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <Text>重置密码链接已发送到您的邮箱，请查收。</Text>
            <div style={{ marginTop: 24 }}>
              <Link to="/login">返回登录</Link>
            </div>
          </div>
        ) : (
          <Form
            name="forgot-password"
            onFinish={handleSubmit}
            size="large"
          >
            <Text style={{ display: 'block', marginBottom: 24 }}>
              请输入您的注册邮箱，我们将向您发送重置密码的链接。
            </Text>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="邮箱"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                发送重置链接
              </Button>
            </Form.Item>

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'center' }}>
                <Link to="/login">返回登录</Link>
              </Space>
            </Form.Item>
          </Form>
        )}
      </StyledCard>
    </Container>
  );
};

export default ForgotPassword;