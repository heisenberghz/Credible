/**
 * Credible Extension Configuration
 */

export const CONFIG = {
  BACKEND_BASE_URL: 'http://localhost:8000',
  // The backend allows up to 70s for the AI stage, so the client must wait
  // longer than that before aborting the scan.
  API_TIMEOUT_MS: 80000,
  EXTENSION_VERSION: '0.1.0',
};

