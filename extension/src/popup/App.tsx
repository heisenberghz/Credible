import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageType,
  ScanLifecycleState,
  ExtensionMessage,
} from '../types/extension';
import { AnalysisReport } from '../types/analysis';
import './popup.css';

export const App: React.FC = () => {
  const [state, setState] = useState<ScanLifecycleState>('idle');
  const [statusText, setStatusText] = useState<string>('Ready');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll or fetch latest report from background on mount
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: MessageType.GET_LATEST_REPORT },
        (res) => {
          if (chrome.runtime.lastError) {
            // Service worker might be sleeping, keep idle
            return;
          }
          if (res) {
            if (res.state) setState(res.state);
            if (res.statusText) setStatusText(res.statusText);
            if (res.report) setReport(res.report);
            if (res.error) setErrorMessage(res.error);
          }
        }
      );

      // Listen for broadcasts from service worker or content script
      const listener = (message: ExtensionMessage) => {
        if (message.type === MessageType.SCAN_PROGRESS) {
          setState(message.state);
          setStatusText(message.statusText);
        } else if (message.type === MessageType.SCAN_SUCCESS) {
          setState('completed');
          setStatusText('Analysis Complete');
          setReport(message.report);
        } else if (message.type === MessageType.SCAN_ERROR) {
          setState('failed');
          setStatusText('Scan Error');
          setErrorMessage(message.error);
        }
      };

      chrome.runtime.onMessage?.addListener(listener);
      return () => {
        chrome.runtime.onMessage?.removeListener(listener);
      };
    }
  }, []);

  const isScanning = state === 'extracting' || state === 'analyzing';

  const handleScan = useCallback(async () => {
    if (isScanning) return; // Prevent duplicate concurrent submissions

    setState('extracting');
    setStatusText('Reading visible page signals...');
    setErrorMessage(null);

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: MessageType.REQUEST_SCAN },
        (res) => {
          if (chrome.runtime.lastError) {
            setState('failed');
            setStatusText('Connection Error');
            setErrorMessage(chrome.runtime.lastError.message || 'Background worker unavailable');
            return;
          }
          if (res && !res.success && res.error) {
            setState('failed');
            setStatusText('Scan Failed');
            setErrorMessage(res.error);
          }
        }
      );
    } else {
      // Fallback preview mode for non-extension / test environments
      setTimeout(() => {
        setState('analyzing');
        setStatusText('Evaluating threats & Trust DNA...');
        setTimeout(() => {
          setState('completed');
          setStatusText('Analysis Complete');
        }, 1200);
      }, 1000);
    }
  }, [isScanning]);

  const handleOpenSidePanel = useCallback(() => {
    if (typeof chrome !== 'undefined') {
      // 1. Broadcast to runtime/background (keeps test contracts and message bus in sync)
      if (chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: MessageType.OPEN_SIDEPANEL });
      }

      // 2. Directly open side panel using the popup user gesture
      if (chrome.sidePanel?.open && chrome.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const tabId = tabs?.[0]?.id;
          if (tabId) {
            chrome.sidePanel.open({ tabId }).then(() => {
              try {
                window.close();
              } catch {
                // Ignore in testing environments
              }
            }).catch((err) => {
              console.warn('[Credible Popup] Failed to open side panel:', err);
            });
          }
        });
      }
    }
  }, []);

  return (
    <div className="popup-container" data-testid="popup-container">
      {/* Header */}
      <header className="popup-header">
        <div className="brand-wrapper">
          <div className="brand-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h1 className="brand-title">Credible</h1>
            <p className="brand-tagline">Defensive Security</p>
          </div>
        </div>
      </header>

      {/* Center Radar / Pulse / Status Area */}
      <main className="status-display">
        <div className="pulse-wrapper" data-testid="pulse-wrapper">
          {isScanning && (
            <>
              <div className="pulse-ring" />
              <div className="pulse-ring" />
            </>
          )}
          <div
            className={`pulse-core ${state === 'completed' ? 'completed' : ''} ${state === 'failed' ? 'failed' : ''}`}
            data-testid="pulse-core"
          >
            {state === 'completed' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : state === 'failed' ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            )}
          </div>
        </div>

        <div
          className={`status-badge ${isScanning ? 'scanning' : ''} ${state === 'completed' ? 'completed' : ''} ${state === 'failed' ? 'failed' : ''}`}
          data-testid="status-badge"
        >
          <span className="status-dot" />
          <span data-testid="status-text">{statusText}</span>
        </div>

        <p className="status-description" data-testid="status-description">
          {state === 'idle' && 'Click below to inspect the active tab for security, deception, and phishing threats.'}
          {state === 'extracting' && 'Extracting visible DOM text, forms, and security signals safely...'}
          {state === 'analyzing' && 'Reconciling deterministic rules and defensive intelligence...'}
          {state === 'completed' &&
            (report
              ? `Status: ${report.assessment_status.replace(/_/g, ' ').toUpperCase()}`
              : 'Scan complete. View deep Trust DNA in side panel.')}
          {state === 'failed' && (errorMessage || 'Scan could not complete. Check backend connection.')}
        </p>
      </main>

      {/* Actions */}
      <footer className="actions-section">
        {state === 'completed' ? (
          <>
            <button
              className="btn-primary"
              onClick={handleOpenSidePanel}
              data-testid="view-sidepanel-btn"
            >
              <span>View Full Analysis in Side Panel</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
            <button
              className="btn-secondary"
              onClick={handleScan}
              data-testid="rescan-btn"
              style={{ marginTop: '6px' }}
            >
              <span>Scan Current Page</span>
            </button>
          </>
        ) : (
          <button
            className="btn-primary"
            onClick={handleScan}
            disabled={isScanning}
            data-testid="scan-btn"
          >
            {isScanning ? (
              <span>Analyzing Page...</span>
            ) : state === 'failed' ? (
              <span>Retry Scan</span>
            ) : (
              <span>Scan This Page</span>
            )}
          </button>
        )}

        <button
          className="btn-secondary"
          onClick={handleOpenSidePanel}
          data-testid="open-sidepanel-link"
        >
          <span>Open Side Panel</span>
        </button>

        <button
          className="btn-secondary"
          onClick={() => {
            if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
              chrome.tabs.create({ url: chrome.runtime.getURL('src/dashboard/index.html') });
            }
          }}
          data-testid="open-dashboard-link"
          style={{ marginTop: '6px' }}
        >
          <span>Open Full Dashboard ↗</span>
        </button>

        <div className="popup-footer">
          <span className="footer-hint">Privacy-preserving • Zero passwords collected</span>
        </div>
      </footer>
    </div>
  );
};
