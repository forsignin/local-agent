import { type Monaco } from '@monaco-editor/react';

// 配置 Monaco Editor
// loader.config({
//   paths: {
//     vs: 'https://unpkg.com/monaco-editor@0.33.0/min/vs',
//   },
//   'vs/css': { disabled: true },
// });

// 默认编辑器选项
export const defaultEditorOptions = {
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  fontSize: 14,
  lineNumbers: 'on' as const,
  roundedSelection: false,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  readOnly: false,
  automaticLayout: true,
};

// 编辑器主题配置
export const editorThemes = {
  light: 'vs',
  dark: 'vs-dark',
} as const;

// 支持的语言
export const supportedLanguages = [
  'javascript',
  'typescript',
  'python',
  'java',
  'go',
  'rust',
  'json',
  'markdown',
  'yaml',
  'shell',
] as const;

// 初始化函数
export const initializeMonaco = (monaco: Monaco) => {
  // 这里可以添加自定义的 Monaco 配置
  // 例如：注册新的语言、主题等
}; 