import { createOverlay, TelemetryClient } from '@dap-overlay/sdk-vanilla';
import '@dap-overlay/sdk-vanilla/styles.css';
import stepsData from './steps.json';

// Initialize telemetry client
const telemetryClient = new TelemetryClient({
  baseUrl: 'http://localhost:3001',
  useMock: true,
});

// Create overlay instance
const overlay = createOverlay({
  steps: stepsData,
  telemetryClient,
  autoRender: false,
});

// Register callbacks
overlay.registerCallback('retryLogin', () => {
  console.log('Retry login clicked');
  alert('Retrying login...');
  updateContext();
});

overlay.registerCallback('refreshPage', () => {
  console.log('Refresh page clicked');
  alert('Refreshing page...');
  updateContext();
});

overlay.registerCallback('dismissValidation', () => {
  console.log('Validation dismissed');
  updateContext();
});

overlay.registerCallback('tryExport', () => {
  console.log('Try export clicked');
  alert('Opening export dialog...');
});

// Get form elements
const useMockCheckbox = document.getElementById('use-mock');
const errorSelect = document.getElementById('error-select');
const pathSelect = document.getElementById('path-select');
const updateButton = document.getElementById('update-context');

// Update context and re-render
function updateContext() {
  const errorId = errorSelect.value;
  const path = pathSelect.value;
  const useMock = useMockCheckbox.checked;

  // Update telemetry client mode
  telemetryClient.setMockMode(useMock);

  // Update overlay context
  overlay.updateContext(
    errorId ? { errorId } : {},
    { path }
  );
}

// Event listeners
updateButton.addEventListener('click', updateContext);
useMockCheckbox.addEventListener('change', updateContext);

// Initial render with dashboard path
updateContext();
