import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

async function enableMocking() {
  const useMock = import.meta.env.VITE_USE_MOCK_TELEMETRY === 'true';

  if (!useMock) {
    return;
  }

  const { worker } = await import('@dap-overlay/mocks/browser');

  return worker.start({
    onUnhandledRequest: 'bypass',
  });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
