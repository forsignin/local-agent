import api from './api';
import type {
  FileInfo,
  FileType,
  FileOperationConfig,
  FileOperationResult,
  ConversionJob,
  BatchOperation,
} from '../types/fileProcessor';

// 文件管理
export const listFiles = async (directory: string): Promise<FileInfo[]> => {
  const response = await api.get('/file-processor/files', {
    params: { directory },
  });
  return response.data;
};

export const uploadFile = async (
  file: File,
  directory?: string
): Promise<FileInfo> => {
  const formData = new FormData();
  formData.append('file', file);
  if (directory) {
    formData.append('directory', directory);
  }
  const response = await api.post('/file-processor/files/upload', formData);
  return response.data;
};

export const deleteFile = async (path: string): Promise<void> => {
  await api.delete(`/file-processor/files`, {
    params: { path },
  });
};

// 文件转换
export const startConversion = async (
  config: FileOperationConfig
): Promise<{
  jobId: string;
  status: 'pending';
}> => {
  const response = await api.post('/file-processor/conversions', config);
  return response.data;
};

export const getConversionStatus = async (jobId: string): Promise<ConversionJob> => {
  const response = await api.get(`/file-processor/conversions/${jobId}`);
  return response.data;
};

export const cancelConversion = async (jobId: string): Promise<void> => {
  await api.post(`/file-processor/conversions/${jobId}/cancel`);
};

// 批量操作
export const startBatchOperation = async (
  type: BatchOperation['type'],
  files: string[],
  config: FileOperationConfig
): Promise<{
  operationId: string;
  status: 'pending';
}> => {
  const response = await api.post('/file-processor/batch', {
    type,
    files,
    config,
  });
  return response.data;
};

export const getBatchOperationStatus = async (
  operationId: string
): Promise<BatchOperation> => {
  const response = await api.get(`/file-processor/batch/${operationId}`);
  return response.data;
};

export const cancelBatchOperation = async (operationId: string): Promise<void> => {
  await api.post(`/file-processor/batch/${operationId}/cancel`);
};

// 文件预览
export const getFilePreview = async (
  path: string,
  options?: {
    page?: number;
    width?: number;
    height?: number;
    quality?: number;
  }
): Promise<{
  type: FileType;
  content: string;
  thumbnail?: string;
}> => {
  const response = await api.get('/file-processor/preview', {
    params: { path, ...options },
  });
  return response.data;
};

// 文件压缩
export const compressFiles = async (
  files: string[],
  options: {
    type: 'gzip' | 'zip' | 'tar' | 'rar';
    level?: number;
    password?: string;
    target: string;
  }
): Promise<FileOperationResult> => {
  const response = await api.post('/file-processor/compress', {
    files,
    options,
  });
  return response.data;
};

// 文件解压
export const extractArchive = async (
  path: string,
  options: {
    target: string;
    password?: string;
    filter?: string[];
  }
): Promise<FileOperationResult> => {
  const response = await api.post('/file-processor/extract', {
    path,
    options,
  });
  return response.data;
};

// 文件合并
export const mergeFiles = async (
  files: string[],
  options: {
    type: FileType;
    target: string;
    template?: string;
  }
): Promise<FileOperationResult> => {
  const response = await api.post('/file-processor/merge', {
    files,
    options,
  });
  return response.data;
};

// 文件分割
export const splitFile = async (
  path: string,
  options: {
    parts: number;
    target: string;
  }
): Promise<FileOperationResult[]> => {
  const response = await api.post('/file-processor/split', {
    path,
    options,
  });
  return response.data;
};

// 文件元数据
export const getFileMetadata = async (
  path: string
): Promise<Record<string, any>> => {
  const response = await api.get('/file-processor/metadata', {
    params: { path },
  });
  return response.data;
};

export const updateFileMetadata = async (
  path: string,
  metadata: Record<string, any>
): Promise<void> => {
  await api.put('/file-processor/metadata', {
    path,
    metadata,
  });
}; 