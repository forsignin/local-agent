import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from 'web/App';
import { ToolProvider } from 'web/context/ToolContext';
import 'antd/dist/reset.css';
import 'web/styles/index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ToolProvider>
        <App />
      </ToolProvider>
    </BrowserRouter>
  </React.StrictMode>
); 