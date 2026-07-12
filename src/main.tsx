import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global Fetch Interceptor to ensure credentials are always sent (essential for httpOnly cookie auth in iframes)
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  const modifiedInit = {
    credentials: "include" as const,
    ...init,
  };
  return originalFetch(input, modifiedInit);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
