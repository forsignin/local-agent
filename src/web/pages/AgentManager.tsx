import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Tag, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { fetchAgents } from '../services/api';
import type { Agent, AgentStatus, AgentType } from '../types/agent';

const AgentManager: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const response = await fetchAgents();
      setAgents(response.data);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      message.error('加载代理列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const columns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: AgentType) => {
        const typeMap: Record<AgentType, { color: string; text: string }> = {
          executor: { color: 'blue', text: '执行器' },
          planner: { color: 'purple', text: '规划器' },
          assistant: { color: 'green', text: '助手' },
          custom: { color: 'orange', text: '自定义' },
        };
        return <Tag color={typeMap[type].color}>{typeMap[type].text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AgentStatus) => {
        const statusMap: Record<AgentStatus, { color: string; text: string }> = {
          idle: { color: 'green', text: '空闲' },
          busy: { color: 'orange', text: '忙碌' },
          error: { color: 'red', text: '错误' },
          offline: { color: 'default', text: '离线' },
        };
        return <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Agent) => (
        <Space size="middle">
          <Button type="link">查看</Button>
          <Button type="link">编辑</Button>
          <Button type="link" danger>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="代理管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />}>
          新建代理
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={agents}
        loading={loading}
        rowKey="id"
        pagination={{
          total: agents.length,
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 个代理`,
        }}
      />
    </Card>
  );
};

export default AgentManager; 