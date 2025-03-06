import React from 'react';
import { Form, Input, Select, Button, Steps, Card, message } from 'antd';
import { CodeOutlined, DatabaseOutlined, FileOutlined } from '@ant-design/icons';
import styled from 'styled-components';

const { Step } = Steps;
const { TextArea } = Input;
const { Option } = Select;

const StyledCard = styled(Card)`
  max-width: 800px;
  margin: 0 auto;
`;

const StepContent = styled.div`
  margin-top: 24px;
  min-height: 200px;
`;

const ButtonGroup = styled.div`
  margin-top: 24px;
  display: flex;
  justify-content: space-between;
`;

interface TaskCreateProps {
  onSubmit: (values: any) => Promise<void>;
}

const TaskCreate: React.FC<TaskCreateProps> = ({ onSubmit }) => {
  const [current, setCurrent] = React.useState(0);
  const [form] = Form.useForm();

  const steps = [
    {
      title: '选择类型',
      content: (
        <Form.Item name="type" rules={[{ required: true, message: '请选择任务类型' }]}>
          <Select size="large" placeholder="请选择任务类型">
            <Option value="code_analysis">
              <CodeOutlined /> 代码分析
            </Option>
            <Option value="data_processing">
              <DatabaseOutlined /> 数据处理
            </Option>
            <Option value="file_operation">
              <FileOutlined /> 文件操作
            </Option>
          </Select>
        </Form.Item>
      ),
    },
    {
      title: '任务描述',
      content: (
        <>
          <Form.Item name="name" rules={[{ required: true, message: '请输入任务名称' }]}>
            <Input size="large" placeholder="任务名称" />
          </Form.Item>
          <Form.Item
            name="description"
            rules={[{ required: true, message: '请输入任务描述' }]}
          >
            <TextArea
              rows={4}
              size="large"
              placeholder="请详细描述任务要求和目标"
            />
          </Form.Item>
        </>
      ),
    },
    {
      title: '配置参数',
      content: (
        <Form.Item name="config">
          <Input.TextArea
            rows={6}
            placeholder="请输入任务配置参数（JSON格式）"
          />
        </Form.Item>
      ),
    },
    {
      title: '确认提交',
      content: (
        <Form.Item>
          <div style={{ textAlign: 'center' }}>
            <h3>请确认任务信息</h3>
            <p>任务类型：{form.getFieldValue('type')}</p>
            <p>任务名称：{form.getFieldValue('name')}</p>
            <p>任务描述：{form.getFieldValue('description')}</p>
          </div>
        </Form.Item>
      ),
    },
  ];

  const next = async () => {
    try {
      await form.validateFields();
      setCurrent(current + 1);
    } catch (error) {
      message.error('请填写必要信息');
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      message.success('任务创建成功');
      form.resetFields();
      setCurrent(0);
    } catch (error) {
      message.error('任务创建失败');
    }
  };

  return (
    <StyledCard>
      <Steps current={current}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>
      <StepContent>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ type: 'code_analysis' }}
        >
          {steps[current].content}
        </Form>
      </StepContent>
      <ButtonGroup>
        {current > 0 && (
          <Button style={{ margin: '0 8px' }} onClick={prev}>
            上一步
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button type="primary" onClick={next}>
            下一步
          </Button>
        )}
        {current === steps.length - 1 && (
          <Button type="primary" onClick={handleSubmit}>
            提交
          </Button>
        )}
      </ButtonGroup>
    </StyledCard>
  );
};

export default TaskCreate;