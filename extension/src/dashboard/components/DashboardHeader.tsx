import React from 'react';
import { AnalysisReport } from '../../types/analysis';
import { useEngineStatus } from '../../hooks/useEngineStatus';
import { downloadDossier } from '../utils/dossierExporter';
import { CredibleLogoMark } from '../../components/CredibleLogoMark';

interface DashboardHeaderProps {
  report: AnalysisReport | null;
  onScan: () => void;
  isScanning: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  report,
  onScan,
  isScanning,
}) => {
  const engine = useEngineStatus(report?.timestamp ?? null);
  const beaconColor =
    engine.state === 'online'
      ? '#059669'
      : engine.state === 'degraded'
        ? '#D97706'
        : engine.state === 'deterministic'
          ? '#D97706'
          : engine.state === 'offline'
            ? '#E11D48'
            : '#475569';

  return (
    <header className="dashboard-header" data-testid="dashboard-header">
      <div className="dashboard-header-inner">
        {/* Brand Lockup with Unsloped Logo and Engine Beacon */}
        <div className="brand-lockup">
          <div className="brand-logo-frame">
            <CredibleLogoMark size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 className="brand-title">
                CREDIBLE COMMAND CENTER
              </h1>
              <span className="badge-audit">
                v2.4 AUDIT
              </span>
              <span
                className={`engine-beacon engine-${engine.state}`}
                title={engine.detail}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <span
                  className="engine-beacon-dot"
                  style={{ width: 5, height: 5, borderRadius: '50%', background: beaconColor }}
                />
                {engine.label}
              </span>
            </div>
            <p className="brand-subtitle">
              Defensive Cybersecurity Workstation · Client-Side Heuristic Engine & Detection Pipeline
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="header-actions">
          {report && (
            <>
              <button
                onClick={() => downloadDossier(report, 'markdown')}
                data-testid="export-markdown-btn"
                className="btn-header-action"
                title="Download complete forensic audit dossier in Markdown"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>EXPORT DOSSIER (.MD)</span>
              </button>

              <button
                onClick={() => downloadDossier(report, 'json')}
                data-testid="export-json-btn"
                className="btn-header-action"
                title="Download raw report schema in JSON format"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span>&lt;&gt; JSON</span>
              </button>
            </>
          )}

          <button
            onClick={onScan}
            disabled={isScanning}
            data-testid="dashboard-scan-btn"
            className="btn-header-scan"
            title={isScanning ? 'AI analysis can take up to about a minute on the free tier' : 'Trigger full scan of active Chrome tab'}
          >
            {isScanning ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="loading-spinner" aria-hidden="true">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
            )}
            <span>{isScanning ? 'SCANNING...' : 'SCAN ACTIVE TAB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
