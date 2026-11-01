import React, { useState, useEffect, useCallback } from 'react';
import {
  ExtensionMessage,
  MessageType,
  ScanLifecycleState,
} from '../types/extension';
import { AnalysisReport } from '../types/analysis';
import { Header } from './components/Header';
import { AssessmentSummary } from './components/AssessmentSummary';
import { FindingList } from './components/FindingList';
import { ErrorState } from './components/ErrorState';
import './sidepanel.css';

export const App: React.FC = () => {
  const [state, setState] = useState<ScanLifecycleState>('idle');
  const [statusText, setStatusText] = useState<string>('Ready');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch initial report & listen for live background updates
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: MessageType.GET_LATEST_REPORT },
        (res) => {
          if (chrome.runtime.lastError) return;
          if (res) {
            if (res.state) setState(res.state);
            if (res.statusText) setStatusText(res.statusText);
            if (res.report) setReport(res.report);
            if (res.error) setErrorMessage(res.error);
          }
        }
      );

      const listener = (message: ExtensionMessage) => {
        if (message.type === MessageType.SCAN_PROGRESS) {
          setState(message.state);
          setStatusText(message.statusText);
        } else if (message.type === MessageType.SCAN_SUCCESS) {
          setState('completed');
          setStatusText('Scan Complete');
          setReport(message.report);
          setErrorMessage(null);
        } else if (message.type === MessageType.SCAN_ERROR) {
          setState('failed');
          setStatusText('Scan Failed');
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

  const handleScan = useCallback(() => {
    if (isScanning) return;

    setState('extracting');
    setStatusText('Reading visible page signals...');
    setErrorMessage(null);

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: MessageType.REQUEST_SCAN }, (res) => {
        if (chrome.runtime.lastError) {
          setState('failed');
          setErrorMessage(
            chrome.runtime.lastError.message || 'Background service unavailable'
          );
          return;
        }
        if (res && !res.success && res.error) {
          setState('failed');
          setErrorMessage(res.error);
        }
      });
    }
  }, [isScanning]);

  return (
    <div className="sidepanel-container" data-testid="sidepanel-root">
      <Header onScan={handleScan} isScanning={isScanning} />

      <main className="sidepanel-content">
        {isScanning && <ErrorState type="loading" message={statusText} />}

        {state === 'failed' && !isScanning && (
          <ErrorState type="error" message={errorMessage} onRetry={handleScan} />
        )}

        {state === 'idle' && !report && !isScanning && (
          <ErrorState type="idle" onRetry={handleScan} />
        )}

        {report && !isScanning && (
          <>
            <AssessmentSummary report={report} />
            <FindingList findings={report.findings} />
          </>
        )}
      </main>
    </div>
  );
};
