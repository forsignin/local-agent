export type FileType = 'text' | 'image' | 'pdf' | 'office' | 'archive' | 'binary';

export interface FileInfo {
  name: string;
  path: string;
  type: FileType;
  size: number;
  mimeType: string;
  lastModified: string;
  metadata?: Record<string, any>;
}

export interface FileOperationConfig {
  source: string | File;
  target?: string;
  type?: FileType;
  options?: {
    encoding?: string;
    compression?: {
      type: 'gzip' | 'zip' | 'tar' | 'rar';
      level?: number;
    };
    image?: {
      format?: 'jpeg' | 'png' | 'webp' | 'gif';
      quality?: number;
      width?: number;
      height?: number;
      fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    };
    pdf?: {
      pages?: number[];
      password?: string;
      metadata?: Record<string, string>;
    };
    office?: {
      format?: 'pdf' | 'html' | 'text' | 'markdown';
      template?: string;
      variables?: Record<string, any>;
    };
  };
}

export interface FileOperationResult {
  success: boolean;
  path?: string;
  type?: FileType;
  size?: number;
  mimeType?: string;
  lastModified?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ConversionJob {
  id: string;
  source: FileInfo;
  target: {
    type: FileType;
    path: string;
    options?: Record<string, any>;
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: FileOperationResult;
  error?: Error;
  createdAt: string;
  updatedAt: string;
}

export interface BatchOperation {
  id: string;
  type: 'convert' | 'compress' | 'extract' | 'merge';
  files: FileInfo[];
  config: FileOperationConfig;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  results: FileOperationResult[];
  error?: Error;
  createdAt: string;
  updatedAt: string;
}

export interface FileProcessorState {
  files: Map<string, FileInfo>;
  activeJobs: Map<string, ConversionJob>;
  batchOperations: Map<string, BatchOperation>;
  selectedFiles: Set<string>;
  loading: boolean;
  error: string | null;
} 