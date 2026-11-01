import React from 'react';

export type ErrorStateType = 'loading' | 'idle' | 'offline' | 'timeout' | 'error';

interface ErrorStateProps {
  type: ErrorStateType;
  message?: string | null;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  type,
  message,
  onRetry,
}) => {
  if (type === 'loading') {
    return (
      <div
        className="state-container loading-state fade-in"
        data-testid="state-loading"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: '36px',
            height: '36px',
            border: '3px solid #E2E8F0',
            borderTopColor: '#2563EB',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '16px',
          }}
        />
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
          Analyzing Page Signals
        </h4>
        <p
          data-testid="loading-status-text"
          style={{ fontSize: '13px', color: '#64748B', maxWidth: '240px', lineHeight: '1.4', marginBottom: '24px' }}
        >
          {message || 'Reconciling deterministic checks and threat intelligence...'}
        </p>

        {/* Loading Skeleton Placeholders */}
        <div style={{ width: '100%', maxWidth: '280px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="skeleton-box" style={{ height: '38px', width: '100%' }} />
          <div className="skeleton-box" style={{ height: '56px', width: '100%' }} />
          <div className="skeleton-box" style={{ height: '72px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (type === 'idle') {
    return (
      <div
        className="state-container idle-state fade-in"
        data-testid="state-idle"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '50px 20px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            fontSize: '24px',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#0F172A', marginBottom: '6px' }}>
          Ready for Safety Assessment
        </h4>
        <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '250px', lineHeight: '1.4', marginBottom: '20px' }}>
          Open the Credible popup or click below to evaluate the current active tab for deception and threats.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            data-testid="scan-action-btn"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            Scan Current Page
          </button>
        )}
      </div>
    );
  }

  // Error configurations
  const isOffline = type === 'offline' || message?.toLowerCase().includes('unreachable') || message?.toLowerCase().includes('offline');
  const isTimeout = type === 'timeout' || message?.toLowerCase().includes('timeout') || message?.toLowerCase().includes('timed out');

  const title = isOffline
    ? 'Backend Unavailable'
    : isTimeout
    ? 'Analysis Timed Out'
    : 'Assessment Error';

  const defaultMsg = isOffline
    ? 'Credible backend service is unreachable. Ensure the FastAPI server is running on http://localhost:8000.'
    : isTimeout
    ? 'The analysis engine took longer than 15 seconds to reply. Please try again.'
    : message || 'An unexpected error occurred during security analysis.';

  return (
    <div
      className="state-container error-state fade-in"
      data-testid="state-error"
      data-error-type={type}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #FEE2E2',
        boxShadow: '0 2px 6px rgba(220, 38, 38, 0.05)',
        margin: '12px 0',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#FEF2F2',
          color: '#DC2626',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          fontSize: '20px',
        }}
      >
        ⚠️
      </div>

      <h4
        data-testid="error-title"
        style={{ fontSize: '15px', fontWeight: 600, color: '#991B1B', marginBottom: '6px' }}
      >
        {title}
      </h4>

      <p
        data-testid="error-message"
        style={{ fontSize: '13px', color: '#64748B', maxWidth: '260px', lineHeight: '1.45', marginBottom: '18px' }}
      >
        {message || defaultMsg}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          data-testid="retry-btn"
          style={{
            padding: '9px 18px',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease',
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};
