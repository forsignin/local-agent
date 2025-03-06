import React from 'react';
import { Card, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import TaskCreateComponent from '../components/task/TaskCreate';
import { createTask } from '../services/api';

const TaskCreate: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (values: any) => {
    try {
      await createTask(values);
      message.success('任务创建成功');
      navigate('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
      message.error('任务创建失败');
    }
  };

  return (
    <div>
      <Card title="创建任务">
        <TaskCreateComponent onSubmit={handleSubmit} />
      </Card>
    </div>
  );
};

export default TaskCreate; 