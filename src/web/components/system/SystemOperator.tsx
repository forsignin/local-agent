import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Progress,
  Tag,
  Tabs,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  ReloadOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useSystemOperator } from '../../context/SystemOperatorContext';
import type {
  ProcessInfo,
  FileSystemOperation,
  ServiceInfo,
} from '../../types/systemOperator';
import styled from 'styled-components';

const { Option } = Select;
const { TabPane } = Tabs;

const Container = styled.div`
  padding: 20px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

const MetricsCard = styled(Card)`
  .ant-statistic {
    .ant-statistic-title {
      font-size: 14px;
    }
    .ant-statistic-content {
      font-size: 24px;
    }
  }
`;

export const SystemOperator: React.FC = () => {
  const {
    state: { processes, metrics, activeOperations, services, loading },
    listProcesses,
    killProcess,
    startFileOperation,
    cancelFileOperation,
    setFilePermissions,
    listServices,
    startService,
    stopService,
    restartService,
    enableService,
    disableService,
    executeCommand,
  } = useSystemOperator();

  const [isPermissionsModalVisible, setIsPermissionsModalVisible] = useState(false);
  const [isCommandModalVisible, setIsCommandModalVisible] = useState(false);
  const [permissionsForm] = Form.useForm();
  const [commandForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('processes');

  const handleKillProcess = async (pid: number, force = false) => {
    try {
      await killProcess(pid, { signal: force ? 'SIGKILL' : 'SIGTERM' });
      message.success('进程已终止');
    } catch (error) {
      message.error('终止进程失败：' + (error as Error).message);
    }
  };

  const handleSetPermissions = async (values: {
    path: string;
    mode?: string;
    owner?: string;
    group?: string;
    recursive?: boolean;
  }) => {
    try {
      await setFilePermissions(values.path, {
        mode: values.mode,
        owner: values.owner,
        group: values.group,
        recursive: values.recursive,
      });
      setIsPermissionsModalVisible(false);
      permissionsForm.resetFields();
      message.success('权限设置成功');
    } catch (error) {
      message.error('权限设置失败：' + (error as Error).message);
    }
  };

  const handleExecuteCommand = async (values: {
    command: string;
    cwd?: string;
    env?: string;
  }) => {
    try {
      const result = await executeCommand(values.command, {
        cwd: values.cwd,
        env: values.env ? JSON.parse(values.env) : undefined,
      });
      setIsCommandModalVisible(false);
      commandForm.resetFields();
      if (result.exitCode === 0) {
        message.success('命令执行成功');
      } else {
        message.error(`命令执行失败（退出码：${result.exitCode}）`);
      }
    } catch (error) {
      message.error('命令执行失败：' + (error as Error).message);
    }
  };

  const processColumns = [
    {
      title: 'PID',
      dataIndex: 'pid',
      key: 'pid',
      width: 100,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProcessInfo['status']) => (
        <Tag
          color={
            status === 'running'
              ? 'green'
              : status === 'stopped'
              ? 'red'
              : 'orange'
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: 'CPU',
      dataIndex: 'cpu',
      key: 'cpu',
      render: (cpu: number) => `${cpu.toFixed(1)}%`,
    },
    {
      title: '内存',
      dataIndex: 'memory',
      key: 'memory',
      render: (memory: number) => `${memory.toFixed(1)}MB`,
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
    },
    {
      title: '启动时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ProcessInfo) => (
        <Space>
          <Button
            size="small"
            danger
            onClick={() => handleKillProcess(record.pid)}
          >
            终止
          </Button>
          <Button
            size="small"
            danger
            type="primary"
            onClick={() => handleKillProcess(record.pid, true)}
          >
            强制终止
          </Button>
        </Space>
      ),
    },
  ];

  const operationColumns = [
    {
      title: '操作ID',
      dataIndex: 'id',
      key: 'id',
      width: 280,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: FileSystemOperation['type']) => <Tag>{type}</Tag>,
    },
    {
      title: '源路径',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: '目标路径',
      dataIndex: 'target',
      key: 'target',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: FileSystemOperation) => (
        <Space>
          <Tag
            color={
              status === 'completed'
                ? 'green'
                : status === 'failed'
                ? 'red'
                : status === 'processing'
                ? 'blue'
                : 'gold'
            }
          >
            {status}
          </Tag>
          {(status === 'processing' || status === 'pending') && (
            <Progress percent={record.progress} size="small" />
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (record: FileSystemOperation) => (
        <Space>
          {(record.status === 'pending' || record.status === 'processing') && (
            <Button
              size="small"
              onClick={() => cancelFileOperation(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const serviceColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ServiceInfo['status']) => (
        <Tag
          color={
            status === 'active'
              ? 'green'
              : status === 'inactive'
              ? 'orange'
              : 'red'
          }
        >
          {status}
        </Tag>
      ),
    },
    {
      title: '启用状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'green' : 'red'}>
          {enabled ? '已启用' : '已禁用'}
        </Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ServiceInfo) => (
        <Space>
          {record.status === 'inactive' ? (
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => startService(record.name)}
            >
              启动
            </Button>
          ) : (
            <Button
              size="small"
              danger
              icon={<PauseCircleOutlined />}
              onClick={() => stopService(record.name)}
            >
              停止
            </Button>
          )}
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => restartService(record.name)}
          >
            重启
          </Button>
          {record.enabled ? (
            <Button
              size="small"
              danger
              onClick={() => disableService(record.name)}
            >
              禁用
            </Button>
          ) : (
            <Button
              size="small"
              type="primary"
              onClick={() => enableService(record.name)}
            >
              启用
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const processData = Array.from(processes.values());
  const operationData = Array.from(activeOperations.values());
  const serviceData = Array.from(services.values());

  return (
    <Container>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <MetricsCard title="CPU">
            <Statistic
              title="使用率"
              value={metrics?.cpu.usage ?? 0}
              suffix="%"
              precision={1}
            />
            <Statistic title="核心数" value={metrics?.cpu.cores ?? 0} />
            {metrics?.cpu.temperature && (
              <Statistic
                title="温度"
                value={metrics.cpu.temperature}
                suffix="°C"
                precision={1}
              />
            )}
          </MetricsCard>
        </Col>
        <Col span={6}>
          <MetricsCard title="内存">
            <Statistic
              title="已用"
              value={(metrics?.memory.used ?? 0) / 1024 / 1024 / 1024}
              suffix="GB"
              precision={1}
            />
            <Statistic
              title="总量"
              value={(metrics?.memory.total ?? 0) / 1024 / 1024 / 1024}
              suffix="GB"
              precision={1}
            />
            <Statistic
              title="使用率"
              value={
                ((metrics?.memory.used ?? 0) / (metrics?.memory.total ?? 1)) * 100
              }
              suffix="%"
              precision={1}
            />
          </MetricsCard>
        </Col>
        <Col span={6}>
          <MetricsCard title="磁盘">
            <Statistic
              title="已用"
              value={(metrics?.disk.used ?? 0) / 1024 / 1024 / 1024}
              suffix="GB"
              precision={1}
            />
            <Statistic
              title="总量"
              value={(metrics?.disk.total ?? 0) / 1024 / 1024 / 1024}
              suffix="GB"
              precision={1}
            />
            <Statistic
              title="使用率"
              value={
                ((metrics?.disk.used ?? 0) / (metrics?.disk.total ?? 1)) * 100
              }
              suffix="%"
              precision={1}
            />
          </MetricsCard>
        </Col>
        <Col span={6}>
          <MetricsCard title="网络">
            <Statistic
              title="接收"
              value={(metrics?.network.bytesReceived ?? 0) / 1024 / 1024}
              suffix="MB"
              precision={1}
            />
            <Statistic
              title="发送"
              value={(metrics?.network.bytesSent ?? 0) / 1024 / 1024}
              suffix="MB"
              precision={1}
            />
            <Statistic
              title="错误数"
              value={metrics?.network.errors ?? 0}
              className="error-count"
            />
          </MetricsCard>
        </Col>
      </Row>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="进程管理" key="processes">
          <StyledCard
            title="进程列表"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => listProcesses()}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Table
              columns={processColumns}
              dataSource={processData}
              rowKey="pid"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </StyledCard>
        </TabPane>

        <TabPane tab="文件操作" key="files">
          <StyledCard
            title="文件操作"
            extra={
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => setIsPermissionsModalVisible(true)}
                >
                  权限设置
                </Button>
              </Space>
            }
          >
            <Table
              columns={operationColumns}
              dataSource={operationData}
              rowKey="id"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </StyledCard>
        </TabPane>

        <TabPane tab="服务管理" key="services">
          <StyledCard
            title="服务列表"
            extra={
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => listServices()}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            }
          >
            <Table
              columns={serviceColumns}
              dataSource={serviceData}
              rowKey="name"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </StyledCard>
        </TabPane>

        <TabPane tab="命令执行" key="command">
          <StyledCard title="命令执行">
            <Button
              type="primary"
              onClick={() => setIsCommandModalVisible(true)}
            >
              执行命令
            </Button>
          </StyledCard>
        </TabPane>
      </Tabs>

      <Modal
        title="设置权限"
        open={isPermissionsModalVisible}
        onOk={() => permissionsForm.submit()}
        onCancel={() => setIsPermissionsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={permissionsForm} onFinish={handleSetPermissions} layout="vertical">
          <Form.Item
            name="path"
            label="路径"
            rules={[{ required: true, message: '请输入文件路径' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="mode" label="权限模式">
            <Input placeholder="例如：644" />
          </Form.Item>
          <Form.Item name="owner" label="所有者">
            <Input />
          </Form.Item>
          <Form.Item name="group" label="用户组">
            <Input />
          </Form.Item>
          <Form.Item name="recursive" valuePropName="checked">
            <Input type="checkbox" />
            递归应用
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="执行命令"
        open={isCommandModalVisible}
        onOk={() => commandForm.submit()}
        onCancel={() => setIsCommandModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={commandForm} onFinish={handleExecuteCommand} layout="vertical">
          <Form.Item
            name="command"
            label="命令"
            rules={[{ required: true, message: '请输入要执行的命令' }]}
          >
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="cwd" label="工作目录">
            <Input />
          </Form.Item>
          <Form.Item name="env" label="环境变量">
            <Input.TextArea placeholder="JSON格式，例如：{'KEY': 'value'}" />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}; 