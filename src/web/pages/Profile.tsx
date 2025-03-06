import React, { useState, useEffect } from 'react';
import { Card, Tabs, Form, Input, Button, message, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types/user';

const { TabPane } = Tabs;

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 24px auto;
`;

const StyledCard = styled(Card)`
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const Profile: React.FC = () => {
  const { state, updateProfile, changePassword } = useAuth();
  const { user } = state;
  const [loading, setLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        organization: user.organization,
        bio: user.bio,
      });
    }
  }, [user, profileForm]);

  const handleProfileSubmit = async (values: Partial<User>) => {
    setLoading(true);
    try {
      await updateProfile(values);
      message.success('个人信息已更新');
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (values: { oldPassword: string; newPassword: string }) => {
    setLoading(true);
    try {
      await changePassword(values.oldPassword, values.newPassword);
      passwordForm.resetFields();
      message.success('密码已修改');
    } catch (error) {
      message.error('修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: '确认删除账号',
      content: '删除账号后，所有数据将无法恢复。确定要继续吗？',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        message.info('账号删除功能开发中');
      },
    });
  };

  return (
    <ProfileContainer>
      <StyledCard title="个人信息">
        <Tabs defaultActiveKey="profile">
          <TabPane tab="基本信息" key="profile">
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSubmit}
            >
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input disabled />
              </Form.Item>
              <Form.Item
                name="email"
                label="邮箱"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="fullName" label="姓名">
                <Input />
              </Form.Item>
              <Form.Item name="phone" label="电话">
                <Input />
              </Form.Item>
              <Form.Item name="organization" label="组织">
                <Input />
              </Form.Item>
              <Form.Item name="bio" label="简介">
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  保存修改
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="修改密码" key="password">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
            >
              <Form.Item
                name="oldPassword"
                label="当前密码"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="新密码"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码长度不能小于8位' },
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="确认新密码"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab="账号安全" key="security">
            <div style={{ padding: '24px 0' }}>
              <Button danger onClick={handleDeleteAccount}>
                删除账号
              </Button>
              <p style={{ marginTop: 8, color: '#999' }}>
                删除账号后，所有数据将无法恢复。请谨慎操作。
              </p>
            </div>
          </TabPane>
        </Tabs>
      </StyledCard>
    </ProfileContainer>
  );
};

export default Profile;