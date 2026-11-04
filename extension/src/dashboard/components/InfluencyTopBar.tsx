import React from 'react';
import { AnalysisReport } from '../../types/analysis';
import { useEngineStatus } from '../../hooks/useEngineStatus';
import { downloadDossier } from '../utils/dossierExporter';

interface InfluencyTopBarProps {
  report: AnalysisReport | null;
  onScan: () => void;
  isScanning: boolean;
}

export const InfluencyTopBar: React.FC<InfluencyTopBarProps> = ({
  report,
  onScan,
  isScanning,
}) => {
  const engine = useEngineStatus(report?.timestamp ?? null);

  return (
    <header className="influency-topbar" data-testid="dashboard-header">
      {/* Left Title Stack */}
      <div className="influency-title-stack">
        <div className="influency-title-row">
          <h1 className="influency-heading">Security Overview</h1>
          <span
            className={`influency-pill-badge engine-${engine.state}`}
            title={engine.detail}
            data-testid="engine-status-badge"
          >
            <span className={`influency-engine-dot engine-${engine.state}`} aria-hidden="true" />
            {engine.label}
          </span>
          <span className="influency-system-tag" title="Credible Forensic System Active">
            CREDIBLE COMMAND CENTER
          </span>
        </div>
        <p className="influency-subheading">
          Real-time deterministic heuristics & multidimensional Trust DNA
        </p>
      </div>

      {/* Right Action Tools */}
      <div className="influency-actions-stack">
        {/* Forensic Export Tools */}
        {report && (
          <div className="influency-dossier-tools">
            <button
              onClick={() => downloadDossier(report, 'markdown')}
              data-testid="export-markdown-btn"
              className="influency-btn-secondary"
              title="Download full forensic audit dossier in Markdown"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>.MD</span>
            </button>

            <button
              onClick={() => downloadDossier(report, 'json')}
              data-testid="export-json-btn"
              className="influency-btn-secondary"
              title="Download raw report schema in JSON format"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span>JSON</span>
            </button>
          </div>
        )}

        {/* Scan Active Tab Button */}
        <button
          onClick={onScan}
          disabled={isScanning}
          data-testid="dashboard-scan-btn"
          className="influency-btn-scan"
          title={isScanning ? 'AI analysis can take up to about a minute on the free tier' : 'Trigger full scan of active Chrome tab'}
        >
          {isScanning ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="influency-spinner" aria-hidden="true">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D4FF00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          )}
          <span>{isScanning ? 'SCANNING...' : 'SCAN ACTIVE TAB'}</span>
        </button>
      </div>
    </header>
  );
};
