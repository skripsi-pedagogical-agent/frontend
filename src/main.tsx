import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress ResizeObserver loop limit exceeded error
// This error is benign and occurs when Monaco or other components resize rapidly
const suppressResizeObserverError = (e: ErrorEvent | PromiseRejectionEvent) => {
  const message = 'message' in e ? e.message : (e.reason?.message || '');
  if (
    message === 'ResizeObserver loop completed with undelivered notifications.' ||
    message === 'ResizeObserver loop limit exceeded'
  ) {
    e.stopImmediatePropagation();
    e.stopPropagation();
  }
};

window.addEventListener('error', suppressResizeObserverError);
window.addEventListener('unhandledrejection', suppressResizeObserverError);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);