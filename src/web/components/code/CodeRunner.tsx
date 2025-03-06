import React, { useState, Suspense, lazy } from 'react';
import {
  Card,
  Select,
  Button,
  Space,
  Input,
  Tabs,
  Table,
  Tag,
  Modal,
  Form,
  InputNumber,
  Spin,
  message,
} from 'antd';
import type { CodeOutput } from '../../types/codeRunner';
import { useCodeRunner } from '../../context/CodeRunnerContext';
import type { RuntimeConfig, CodeInput } from '../../types/codeRunner';
import styled from 'styled-components';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const { Option } = Select;
const { TabPane } = Tabs;

const Container = styled.div`
  padding: 20px;
`;

const EditorContainer = styled.div`
  margin: 16px 0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
`;

const OutputContainer = styled.div`
  background: #1e1e1e;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

interface ExecutionData {
  execId: string;
  status: string;
  output: CodeOutput;
}

export const CodeRunner: React.FC = () => {
  const {
    state: { runtimes, activeRuntime, executions, loading },
    dispatch,
    createRuntime,
    deleteRuntime,
    executeCode,
    cancelExecution,
    installPackage,
    uninstallPackage,
  } = useCodeRunner();

  const [code, setCode] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleCreateRuntime = async (values: RuntimeConfig) => {
    try {
      await createRuntime(values);
      setIsCreateModalVisible(false);
      form.resetFields();
      message.success('运行时创建成功');
    } catch (error) {
      message.error('运行时创建失败：' + (error as Error).message);
    }
  };

  const handleExecute = async () => {
    if (!activeRuntime) {
      message.error('请先选择一个运行时');
      return;
    }

    try {
      const input: CodeInput = {
        code,
        language: runtimes.find((r) => r.id === activeRuntime)?.type || 'python',
      };
      await executeCode(input);
      message.success('代码执行已开始');
    } catch (error) {
      message.error('代码执行失败：' + (error as Error).message);
    }
  };

  const executionColumns = [
    {
      title: '执行ID',
      dataIndex: 'execId',
      key: 'execId',
      width: 280,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: 'gold',
          running: 'blue',
          completed: 'green',
          failed: 'red',
          cancelled: 'gray',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: { execId: string; status: string }) => (
        <Space>
          {['pending', 'running'].includes(record.status) && (
            <Button size="small" onClick={() => cancelExecution(record.execId)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const executionData = Array.from(executions.entries()).map(([execId, data]) => ({
    execId,
    status: data.status,
    output: (data.output as unknown) as CodeOutput,
  }));

  return (
    <Container>
      <StyledCard title="代码执行环境">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Select
              style={{ width: 200 }}
              placeholder="选择运行时"
              value={activeRuntime}
              onChange={(value) => dispatch({ type: 'SET_ACTIVE_RUNTIME', payload: value })}
            >
              {runtimes.map((runtime) => (
                <Option key={runtime.id} value={runtime.id}>
                  {runtime.type} - {runtime.id}
                </Option>
              ))}
            </Select>
            <Button type="primary" onClick={() => setIsCreateModalVisible(true)}>
              创建运行时
            </Button>
          </Space>

          <Tabs defaultActiveKey="code">
            <TabPane tab="代码编辑器" key="code">
              <EditorContainer>
                <Suspense fallback={<Spin tip="加载编辑器..." />}>
                  <MonacoEditor
                    value={code}
                    onChange={(value: string | undefined) => setCode(value || '')}
                    language="python"
                    height="400px"
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                    }}
                  />
                </Suspense>
              </EditorContainer>
              <Space style={{ marginTop: 16 }}>
                <Button type="primary" onClick={handleExecute}>
                  执行
                </Button>
                <Button onClick={() => setCode('')}>清空</Button>
              </Space>
            </TabPane>
            <TabPane tab="执行记录" key="executions">
              <Table
                columns={executionColumns}
                dataSource={executionData}
                rowKey="execId"
                pagination={false}
                scroll={{ y: 400 }}
              />
            </TabPane>
            <TabPane tab="输出" key="output">
              <OutputContainer>
                {Array.from(executions.entries()).map(([id, data]) => (
                  <div key={id}>
                    <div style={{ color: '#666', marginBottom: 8 }}>
                      执行ID: {id} - 状态: {data.status}
                    </div>
                    {data.output && typeof data.output === 'object' && (
                      <>
                        {(data.output as CodeOutput).stdout && (
                          <pre style={{ color: '#fff' }}>{(data.output as CodeOutput).stdout}</pre>
                        )}
                        {(data.output as CodeOutput).stderr && (
                          <pre style={{ color: '#ff4d4f' }}>{(data.output as CodeOutput).stderr}</pre>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </OutputContainer>
            </TabPane>
          </Tabs>
        </Space>
      </StyledCard>

      <Modal
        title="创建运行时"
        open={isCreateModalVisible}
        onOk={() => form.submit()}
        onCancel={() => setIsCreateModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} onFinish={handleCreateRuntime} layout="vertical">
          <Form.Item
            name="type"
            label="运行时类型"
            rules={[{ required: true, message: '请选择运行时类型' }]}
          >
            <Select>
              <Option value="python">Python</Option>
              <Option value="node">Node.js</Option>
              <Option value="shell">Shell</Option>
            </Select>
          </Form.Item>
          <Form.Item name="version" label="版本">
            <Input placeholder="例如：3.9" />
          </Form.Item>
          <Form.Item name="timeout" label="超时时间（秒）">
            <InputNumber min={1} max={3600} defaultValue={300} />
          </Form.Item>
          <Form.Item name="memoryLimit" label="内存限制（MB）">
            <InputNumber min={128} max={4096} defaultValue={512} />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}; 