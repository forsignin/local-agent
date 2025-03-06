import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Upload,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Progress,
  Tag,
  message,
} from 'antd';
import { UploadOutlined, FileOutlined } from '@ant-design/icons';
import { useFileProcessor } from '../../context/FileProcessorContext';
import type {
  FileInfo,
  FileType,
  FileOperationConfig,
  ConversionJob,
  BatchOperation,
} from '../../types/fileProcessor';
import styled from 'styled-components';

const { Option } = Select;

const Container = styled.div`
  padding: 20px;
`;

const StyledCard = styled(Card)`
  margin-bottom: 16px;
`;

const PreviewContainer = styled.div`
  background: #1e1e1e;
  color: #fff;
  padding: 12px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
`;

export const FileProcessor: React.FC = () => {
  const {
    state: { files, activeJobs, batchOperations, selectedFiles, loading },
    listFiles,
    uploadFile,
    deleteFile,
    startConversion,
    cancelConversion,
    startBatchOperation,
    cancelBatchOperation,
    compressFiles,
    extractArchive,
  } = useFileProcessor();

  const [currentDirectory, setCurrentDirectory] = useState('');
  const [isConvertModalVisible, setIsConvertModalVisible] = useState(false);
  const [isCompressModalVisible, setIsCompressModalVisible] = useState(false);
  const [isExtractModalVisible, setIsExtractModalVisible] = useState(false);
  const [convertForm] = Form.useForm();
  const [compressForm] = Form.useForm();
  const [extractForm] = Form.useForm();

  const handleUpload = async (file: File) => {
    try {
      await uploadFile(file, currentDirectory);
      message.success('文件上传成功');
    } catch (error) {
      message.error('文件上传失败：' + (error as Error).message);
    }
  };

  const handleConvert = async (values: FileOperationConfig) => {
    const selectedFilePaths = Array.from(selectedFiles);
    if (selectedFilePaths.length === 0) {
      message.error('请选择要转换的文件');
      return;
    }

    try {
      await startConversion({
        ...values,
        source: selectedFilePaths[0],
      });
      setIsConvertModalVisible(false);
      convertForm.resetFields();
      message.success('文件转换任务已开始');
    } catch (error) {
      message.error('文件转换失败：' + (error as Error).message);
    }
  };

  const handleCompress = async (values: {
    type: 'gzip' | 'zip' | 'tar' | 'rar';
    level?: number;
    password?: string;
    target: string;
  }) => {
    try {
      const selectedFilePaths = Array.from(selectedFiles);
      if (selectedFilePaths.length === 0) {
        message.error('请选择要压缩的文件');
        return;
      }

      await compressFiles(selectedFilePaths, values);
      setIsCompressModalVisible(false);
      compressForm.resetFields();
      message.success('文件压缩成功');
    } catch (error) {
      message.error('文件压缩失败：' + (error as Error).message);
    }
  };

  const handleExtract = async (values: {
    target: string;
    password?: string;
  }) => {
    try {
      const selectedFilePaths = Array.from(selectedFiles);
      if (selectedFilePaths.length === 0) {
        message.error('请选择要解压的文件');
        return;
      }

      await extractArchive(selectedFilePaths[0], values);
      setIsExtractModalVisible(false);
      extractForm.resetFields();
      message.success('文件解压成功');
    } catch (error) {
      message.error('文件解压失败：' + (error as Error).message);
    }
  };

  const fileColumns = [
    {
      title: '文件名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: FileType) => {
        const colorMap: Record<FileType, string> = {
          text: 'blue',
          image: 'green',
          pdf: 'red',
          office: 'orange',
          archive: 'purple',
          binary: 'default',
        };
        return <Tag color={colorMap[type]}>{type}</Tag>;
      },
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => {
        const units = ['B', 'KB', 'MB', 'GB'];
        let value = size;
        let unitIndex = 0;
        while (value >= 1024 && unitIndex < units.length - 1) {
          value /= 1024;
          unitIndex++;
        }
        return `${value.toFixed(2)} ${units[unitIndex]}`;
      },
    },
    {
      title: '修改时间',
      dataIndex: 'lastModified',
      key: 'lastModified',
      render: (time: string) => new Date(time).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FileInfo) => (
        <Space>
          <Button size="small" onClick={() => deleteFile(record.path)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const jobColumns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 280,
    },
    {
      title: '源文件',
      dataIndex: ['source', 'name'],
      key: 'source',
    },
    {
      title: '目标类型',
      dataIndex: ['target', 'type'],
      key: 'targetType',
      render: (type: FileType) => <Tag>{type}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: ConversionJob) => (
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
      render: (record: ConversionJob) => (
        <Space>
          {(record.status === 'pending' || record.status === 'processing') && (
            <Button size="small" onClick={() => cancelConversion(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const batchColumns = [
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
      render: (type: BatchOperation['type']) => <Tag>{type}</Tag>,
    },
    {
      title: '文件数',
      dataIndex: 'files',
      key: 'fileCount',
      render: (files: FileInfo[]) => files.length,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: BatchOperation) => (
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
      render: (record: BatchOperation) => (
        <Space>
          {(record.status === 'pending' || record.status === 'processing') && (
            <Button size="small" onClick={() => cancelBatchOperation(record.id)}>
              取消
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const fileData = Array.from(files.values());
  const jobData = Array.from(activeJobs.values());
  const batchData = Array.from(batchOperations.values());

  return (
    <Container>
      <StyledCard title="文件处理工具">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Upload
              customRequest={({ file }) => handleUpload(file as File)}
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>上传文件</Button>
            </Upload>
            <Button
              onClick={() => setIsConvertModalVisible(true)}
              disabled={selectedFiles.size === 0}
            >
              转换
            </Button>
            <Button
              onClick={() => setIsCompressModalVisible(true)}
              disabled={selectedFiles.size === 0}
            >
              压缩
            </Button>
            <Button
              onClick={() => setIsExtractModalVisible(true)}
              disabled={selectedFiles.size !== 1}
            >
              解压
            </Button>
          </Space>

          <Table
            columns={fileColumns}
            dataSource={fileData}
            rowKey="path"
            rowSelection={{
              selectedRowKeys: Array.from(selectedFiles),
              onChange: (selectedRowKeys) => {
                selectedFiles.clear();
                selectedRowKeys.forEach((key) => selectedFiles.add(key as string));
              },
            }}
            pagination={false}
            scroll={{ y: 400 }}
          />

          <StyledCard title="转换任务">
            <Table
              columns={jobColumns}
              dataSource={jobData}
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </StyledCard>

          <StyledCard title="批量操作">
            <Table
              columns={batchColumns}
              dataSource={batchData}
              rowKey="id"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </StyledCard>
        </Space>
      </StyledCard>

      <Modal
        title="文件转换"
        open={isConvertModalVisible}
        onOk={() => convertForm.submit()}
        onCancel={() => setIsConvertModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={convertForm} onFinish={handleConvert} layout="vertical">
          <Form.Item
            name="type"
            label="目标类型"
            rules={[{ required: true, message: '请选择目标类型' }]}
          >
            <Select>
              <Option value="text">文本</Option>
              <Option value="image">图片</Option>
              <Option value="pdf">PDF</Option>
              <Option value="office">Office文档</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="target"
            label="目标路径"
            rules={[{ required: true, message: '请输入目标路径' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="文件压缩"
        open={isCompressModalVisible}
        onOk={() => compressForm.submit()}
        onCancel={() => setIsCompressModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={compressForm} onFinish={handleCompress} layout="vertical">
          <Form.Item
            name="type"
            label="压缩类型"
            rules={[{ required: true, message: '请选择压缩类型' }]}
          >
            <Select>
              <Option value="zip">ZIP</Option>
              <Option value="tar">TAR</Option>
              <Option value="gzip">GZIP</Option>
              <Option value="rar">RAR</Option>
            </Select>
          </Form.Item>
          <Form.Item name="level" label="压缩级别">
            <InputNumber min={1} max={9} defaultValue={6} />
          </Form.Item>
          <Form.Item name="password" label="密码">
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="target"
            label="目标路径"
            rules={[{ required: true, message: '请输入目标路径' }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="文件解压"
        open={isExtractModalVisible}
        onOk={() => extractForm.submit()}
        onCancel={() => setIsExtractModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={extractForm} onFinish={handleExtract} layout="vertical">
          <Form.Item
            name="target"
            label="目标路径"
            rules={[{ required: true, message: '请输入目标路径' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="password" label="密码">
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </Container>
  );
}; 