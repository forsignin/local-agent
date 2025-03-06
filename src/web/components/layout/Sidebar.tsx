import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  CodeOutlined,
  OrderedListOutlined,
  SettingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';

const { Sider } = Layout;

const Logo = styled.div`
  height: 64px;
  padding: 16px;
  color: white;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
`;

const Sidebar: React.FC = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = React.useState(false);

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: <Link to="/dashboard">仪表盘</Link>,
    },
    {
      key: '/tasks',
      icon: <OrderedListOutlined />,
      label: <Link to="/tasks">任务列表</Link>,
    },
    {
      key: '/code',
      icon: <CodeOutlined />,
      label: <Link to="/code">代码执行</Link>,
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: <Link to="/settings">设置</Link>,
    },
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">个人信息</Link>,
    },
  ];

  return (
    <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
      <Logo>LocalAgent</Logo>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar; 