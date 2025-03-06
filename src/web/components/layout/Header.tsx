import React from 'react';
import { Layout, Avatar, Dropdown, Badge, message } from 'antd';
import { BellOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../context/AuthContext';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = Layout;

const StyledHeader = styled(AntHeader)`
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: #fff;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const { user } = state;

  const handleLogout = async () => {
    try {
      await logout();
      message.success('已退出登录');
      navigate('/login');
    } catch (error) {
      message.error('退出登录失败');
    }
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'all',
      label: '所有通知',
      onClick: () => navigate('/notifications'),
    },
    {
      key: 'unread',
      label: '未读通知',
      onClick: () => navigate('/notifications?filter=unread'),
    },
    {
      type: 'divider',
    },
    {
      key: 'settings',
      label: '通知设置',
      onClick: () => navigate('/settings/notifications'),
    },
  ];

  return (
    <StyledHeader>
      <HeaderRight>
        <Dropdown menu={{ items: notificationMenuItems }} trigger={['click']}>
          <Badge count={5}>
            <BellOutlined style={{ fontSize: '20px', cursor: 'pointer' }} />
          </Badge>
        </Dropdown>
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
          <span style={{ cursor: 'pointer' }}>
            <Avatar src={user?.avatar} icon={!user?.avatar && <UserOutlined />} />
            <span style={{ marginLeft: 8 }}>{user?.username || '未登录'}</span>
          </span>
        </Dropdown>
      </HeaderRight>
    </StyledHeader>
  );
};

export default Header; 