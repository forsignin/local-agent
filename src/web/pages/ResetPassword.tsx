import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { resetPassword } from '../services/auth';

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

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const token = searchParams.get('token');

  if (!token) {
    message.error('无效的重置链接');
    navigate('/login');
    return null;
  }

  const handleSubmit = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      form.setFields([
        {
          name: 'confirmPassword',
          errors: ['两次输入的密码不一致'],
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, values.password);
      message.success('密码重置成功');
      navigate('/login');
    } catch (error) {
      console.error('Failed to reset password:', error);
      message.error('密码重置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <StyledCard>
        <LogoContainer>
          <Logo src="/static/images/logo.png" alt="LocalAgent" />
          <Title level={3}>设置新密码</Title>
        </LogoContainer>

        <Form
          form={form}
          name="reset-password"
          onFinish={handleSubmit}
          size="large"
        >
          <Text style={{ display: 'block', marginBottom: 24 }}>
            请输入您的新密码。
          </Text>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认新密码"
              autoComplete="new-password"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </StyledCard>
    </Container>
  );
};

export default ResetPassword;