import React from 'react';
import { Table, Tag, Space, Button, Tooltip, Badge, Progress } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  EyeOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import type { Task, TaskStatus, TaskType } from '../../types/task';
import type { PresetStatusColorType } from 'antd/es/_util/colors';

const StatusBadge = styled(Badge)`
  .ant-badge-status-dot {
    width: 8px;
    height: 8px;
  }
`;

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onView: (task: Task) => void;
  onStart: (task: Task) => void;
  onPause: (task: Task) => void;
  onStop: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const TaskList: React.FC<TaskListProps> = ({
  tasks = [],
  loading,
  onView,
  onStart,
  onPause,
  onStop,
  onDelete,
}) => {
  const getStatusBadge = (status: TaskStatus) => {
    const statusMap: Record<TaskStatus, { status: PresetStatusColorType; text: string }> = {
      pending: { status: 'warning', text: '等待中' },
      running: { status: 'processing', text: '执行中' },
      completed: { status: 'success', text: '已完成' },
      failed: { status: 'error', text: '失败' },
      paused: { status: 'default', text: '已暂停' },
      stopped: { status: 'default', text: '已停止' },
    };

    return <StatusBadge status={statusMap[status].status} text={statusMap[status].text} />;
  };

  const getTypeTag = (type: TaskType) => {
    const typeMap: Record<TaskType, { color: string; text: string }> = {
      code_execution: { color: 'blue', text: '代码执行' },
      file_processing: { color: 'green', text: '文件处理' },
      network_access: { color: 'purple', text: '网络访问' },
      data_analysis: { color: 'orange', text: '数据分析' },
      text_processing: { color: 'cyan', text: '文本处理' },
      custom: { color: 'default', text: '自定义' },
    };

    return <Tag color={typeMap[type].color}>{typeMap[type].text}</Tag>;
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: TaskType) => getTypeTag(type),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => getStatusBadge(status),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space size="middle">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>
          {record.status === 'running' ? (
            <Tooltip title="暂停任务">
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                onClick={() => onPause(record)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="开始任务">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(record)}
                disabled={['completed', 'failed'].includes(record.status)}
              />
            </Tooltip>
          )}
          <Tooltip title="停止任务">
            <Button
              type="text"
              danger
              icon={<StopOutlined />}
              onClick={() => onStop(record)}
              disabled={['completed', 'failed', 'stopped'].includes(record.status)}
            />
          </Tooltip>
          <Tooltip title="删除任务">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={tasks}
      loading={loading}
      rowKey="id"
      pagination={{
        total: tasks.length,
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 条任务`,
      }}
    />
  );
};

export default TaskList;