import React, { useState, useEffect, useCallback } from 'react';
import {
  ExtensionMessage,
  MessageType,
  ScanLifecycleState,
} from '../types/extension';
import { AnalysisMode, AnalysisReport, SelectionData } from '../types/analysis';
import { Header } from './components/Header';
import { SelectionContextBanner } from './components/SelectionContextBanner';
import { AssessmentSummary } from './components/AssessmentSummary';
import { FindingList } from './components/FindingList';
import { NextBestActionList } from './components/NextBestActionList';
import { TrustDnaPanel } from './components/TrustDnaPanel';
import { ProofModePanel } from './components/ProofModePanel';
import { ChecksAndLimitations } from './components/ChecksAndLimitations';
import { ErrorState } from './components/ErrorState';
import { useElapsedSeconds } from '../hooks/useElapsedSeconds';
import { ScanProgress } from '../components/ScanProgress';
import './sidepanel.css';

export const App: React.FC = () => {
  const [state, setState] = useState<ScanLifecycleState>('idle');
  const [statusText, setStatusText] = useState<string>('Ready');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [selectionData, setSelectionData] = useState<SelectionData | null>(null);
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
            if (res.selectionData) setSelectionData(res.selectionData);
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
          if (message.selectionData) {
            setSelectionData(message.selectionData);
          }
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
  const elapsedSeconds = useElapsedSeconds(isScanning);

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
      <Header onScan={handleScan} isScanning={isScanning} elapsedSeconds={elapsedSeconds} />

      <main className="sidepanel-content">
        {isScanning && (
          <ScanProgress
            active={isScanning}
            elapsedSeconds={elapsedSeconds}
            stage={
              state === 'extracting'
                ? 'Extracting page content'
                : 'Running deterministic checks + AI analysis'
            }
            hint="Free-tier AI can take up to about a minute."
            variant="full"
            testId="sidepanel-scan-progress"
          />
        )}

        {isScanning && <ErrorState type="loading" message={statusText} />}

        {state === 'failed' && !isScanning && (
          <ErrorState type="error" message={errorMessage} onRetry={handleScan} />
        )}

        {state === 'idle' && !report && !isScanning && (
          <ErrorState type="idle" onRetry={handleScan} />
        )}

        {report && !isScanning && (
          <>
            {report.mode === AnalysisMode.SELECTION && (
              <SelectionContextBanner selection={selectionData} />
            )}
            <AssessmentSummary report={report} />
            <NextBestActionList actions={report.next_best_actions} />
            <FindingList findings={report.findings} />
            <TrustDnaPanel dimensions={report.trust_dna} />
            <ProofModePanel entries={report.proof_mode} />
            <ChecksAndLimitations
              checks={report.checks}
              limitations={report.limitations}
            />
          </>
        )}
      </main>
    </div>
  );
};
