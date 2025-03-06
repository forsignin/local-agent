import React from 'react';
import { TaskProvider } from '../../context/TaskContext';
import { AgentProvider } from '../../context/AgentContext';
import { ToolProvider } from '../../context/ToolContext';
import { CodeRunnerProvider } from '../../context/CodeRunnerContext';
import { FileProcessorProvider } from '../../context/FileProcessorContext';
import { NetworkProvider } from '../../context/NetworkContext';
import { DataAnalyzerProvider } from '../../context/DataAnalyzerContext';
import { ExecutorProvider } from '../../context/ExecutorContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <NetworkProvider>
      <ExecutorProvider>
        <FileProcessorProvider>
          <DataAnalyzerProvider>
            <CodeRunnerProvider>
              <TaskProvider>
                <AgentProvider>
                  <ToolProvider shouldLoad={true}>
                    {children}
                  </ToolProvider>
                </AgentProvider>
              </TaskProvider>
            </CodeRunnerProvider>
          </DataAnalyzerProvider>
        </FileProcessorProvider>
      </ExecutorProvider>
    </NetworkProvider>
  );
};

export default AppProviders; 