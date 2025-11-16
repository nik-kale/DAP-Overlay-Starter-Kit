import { useState, useCallback, useMemo } from 'react';
import {
  OverlayOrchestrator,
  useGuideEngine,
  TelemetryClient,
  type TelemetryContext,
  type RouteContext,
  type StepsDocument,
} from '@dap-overlay/sdk-react';
import '@dap-overlay/sdk-react/styles.css';
import stepsData from './steps.json';

function App() {
  const [useMock, setUseMock] = useState(
    import.meta.env.VITE_USE_MOCK_TELEMETRY === 'true'
  );
  const [errorId, setErrorId] = useState<string>('');
  const [path, setPath] = useState<string>('/dashboard');

  // Memoize telemetry client to prevent memory leaks
  const telemetryClient = useMemo(
    () =>
      new TelemetryClient({
        baseUrl: import.meta.env.VITE_API_BASE_URL,
        useMock,
      }),
    [useMock]
  );

  // Memoize contexts to prevent unnecessary re-renders
  const telemetryContext: TelemetryContext = useMemo(
    () => (errorId ? { errorId } : {}),
    [errorId]
  );
  const routeContext: RouteContext = useMemo(() => ({ path }), [path]);

  const {
    activeSteps,
    handleStepShow,
    handleStepDismiss,
    handleCtaClick,
    registerCallback,
  } = useGuideEngine({
    steps: stepsData as StepsDocument,
    telemetryClient,
    telemetryContext,
    routeContext,
  });

  // Register callbacks
  registerCallback('retryLogin', () => {
    console.log('Retry login clicked');
    alert('Retrying login...');
    setErrorId('');
  });

  registerCallback('refreshPage', () => {
    console.log('Refresh page clicked');
    alert('Refreshing page...');
    setErrorId('');
  });

  registerCallback('dismissValidation', () => {
    console.log('Validation dismissed');
    setErrorId('');
  });

  registerCallback('tryExport', () => {
    console.log('Try export clicked');
    alert('Opening export dialog...');
  });

  const handleToggleMock = useCallback(() => {
    setUseMock(!useMock);
    telemetryClient.setMockMode(!useMock);
  }, [useMock, telemetryClient]);

  return (
    <>
      <h1>DAP Overlay SDK - React Demo</h1>

      <div className="card">
        <h2>Controls</h2>
        <div className="controls">
          <div className="control-group">
            <label>
              <input
                type="checkbox"
                checked={useMock}
                onChange={handleToggleMock}
              />{' '}
              Use Mock Telemetry
            </label>
          </div>

          <div className="control-group">
            <label htmlFor="error-select">Simulate Error:</label>
            <select
              id="error-select"
              value={errorId}
              onChange={(e) => setErrorId(e.target.value)}
            >
              <option value="">None</option>
              <option value="AUTH_401">AUTH_401 - Authentication Error</option>
              <option value="NETWORK_TIMEOUT">NETWORK_TIMEOUT - Network Timeout</option>
              <option value="VALIDATION_ERROR">VALIDATION_ERROR - Form Validation</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="path-select">Current Path:</label>
            <select
              id="path-select"
              value={path}
              onChange={(e) => setPath(e.target.value)}
            >
              <option value="/dashboard">/ dashboard</option>
              <option value="/settings">/settings</option>
              <option value="/profile">/profile</option>
            </select>
          </div>

          <div className="control-group">
            <p>
              <strong>Active Steps:</strong>{' '}
              {activeSteps.length > 0
                ? activeSteps.map((s) => s.id).join(', ')
                : 'None'}
            </p>
          </div>
        </div>
      </div>

      <div className="demo-section">
        <h2>Demo Elements</h2>
        <p>These buttons are targets for overlay tooltips:</p>
        <div className="demo-buttons">
          <button id="login-button">Login</button>
          <button id="export-button">Export Data</button>
          <button id="settings-button">Settings</button>
        </div>
      </div>

      <div className="card">
        <h2>Instructions</h2>
        <ol style={{ paddingLeft: '1.5rem' }}>
          <li>Select an error from the dropdown to trigger overlays</li>
          <li>Change the path to see path-based tooltips (like feature highlights)</li>
          <li>Toggle mock/real mode to switch between local and API telemetry</li>
          <li>Click on overlay CTAs to trigger callbacks</li>
        </ol>
      </div>

      {/* Render overlays */}
      <OverlayOrchestrator
        steps={activeSteps}
        onStepShow={handleStepShow}
        onStepDismiss={handleStepDismiss}
        onCtaClick={handleCtaClick}
      />
    </>
  );
}

export default App;
