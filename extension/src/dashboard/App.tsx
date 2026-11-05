import React, { useEffect, useState } from 'react';
import { AnalysisReport, AssessmentStatus, AnalysisMode, Confidence } from '../types/analysis';
import { ExtensionMessage, MessageType } from '../types/extension';
import { InfluencySidebar } from './components/InfluencySidebar';
import { InfluencyTopBar } from './components/InfluencyTopBar';
import { InfluencyTelemetryRail } from './components/InfluencyTelemetryRail';
import { BenchmarkSwitcher } from './components/BenchmarkSwitcher';
import { HeuristicMatrix } from './components/HeuristicMatrix';
import { ScanLedger } from './components/ScanLedger';
import { FindingList } from '../sidepanel/components/FindingList';
import { ChecksAndLimitations } from '../sidepanel/components/ChecksAndLimitations';
import { TrustDnaPanel } from '../sidepanel/components/TrustDnaPanel';
import { ProofModePanel } from '../sidepanel/components/ProofModePanel';
import { NextBestActionList } from '../sidepanel/components/NextBestActionList';
import { apiClient, mapErrorToUserMessage } from '../services/api-client';
import { useElapsedSeconds } from '../hooks/useElapsedSeconds';
import { ScanProgress } from '../components/ScanProgress';

const DEMO_REPORTS: AnalysisReport[] = [
  {
    request_id: 'demo-scen-1-benign',
    status: 'completed',
    assessment_status: AssessmentStatus.BENIGN,
    score: 97,
    summary: 'Standard corporate recruitment patterns observed. No upfront fee requests, deposit demands, or deceptive patterns detected in analyzed content.',
    analyzed_url: 'http://localhost:8080/benign.html',
    mode: AnalysisMode.PAGE,
    timestamp: new Date().toISOString(),
    findings: [],
    trust_dna: [
      {
        id: 'payment_risk',
        name: 'Payment Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No upfront fee requests, deposit demands, or cryptocurrency transfer language observed in content.',
        dimension_score: 99,
        evidence: [],
        limitations: ['Absence of detected payment requests is not a guarantee that off-platform fees will not be requested later.'],
      },
      {
        id: 'identity_risk',
        name: 'Identity Risk',
        status: 'unknown' as any,
        confidence: Confidence.LOW,
        summary: 'Domain conforms to standard naming conventions, but corporate identity was not independently verified via registrar records.',
        dimension_score: 75,
        evidence: [],
        limitations: ['Independent corporate registrar lookup and WHOIS ownership queries were not performed to preserve user privacy.'],
      },
      {
        id: 'social_engineering_risk',
        name: 'Social Engineering Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'No artificial urgency, scarcity countdowns, or unrealistic promises observed in content.',
        dimension_score: 98,
        evidence: [],
        limitations: [],
      },
      {
        id: 'data_exposure_risk',
        name: 'Data Exposure Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No illicit credential harvesting or premature personal identity document collection observed.',
        dimension_score: 99,
        evidence: [],
        limitations: [],
      },
      {
        id: 'link_domain_risk',
        name: 'Link and Domain Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'Secure local development loopback context with standard link structure.',
        dimension_score: 100,
        evidence: [],
        limitations: [],
      },
      {
        id: 'evidence_confidence',
        name: 'Evidence Confidence',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Assessment grounded reliably on client-observable deterministic heuristic rules.',
        dimension_score: 92,
        evidence: [],
        limitations: [],
      },
    ],
    proof_mode: [],
    next_best_actions: [
      "Navigate to the organization's official website directly by typing its address into your browser.",
      "Search for the specific job or internship listing on the company's verified careers portal.",
      "Verify the recruiter's identity using independently sourced contact information.",
    ],
    checks: {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure', 'content.urgency', 'content.credential_pressure'],
      not_executed: [],
      unavailable: [],
      failed: [],
    },
    limitations: [
      'Analysis is strictly grounded in client-observable page indicators without accessing proprietary background check databases.',
    ],
  },
  {
    request_id: 'demo-scen-2-suspicious',
    status: 'completed',
    assessment_status: AssessmentStatus.SUSPICIOUS,
    score: 1,
    summary: 'High-threat fraudulent recruitment pattern detected: demands $250 upfront cryptocurrency deposit, creates artificial 24h scarcity pressure, and prematurely harvests passport and bank details.',
    analyzed_url: 'http://localhost:8080/suspicious.html',
    mode: AnalysisMode.PAGE,
    timestamp: new Date().toISOString(),
    findings: [
      {
        id: 'threat-content.payment_pressure',
        title: 'Upfront Payment or Deposit Requested',
        description: 'Page requests an upfront fee of $250 in cryptocurrency to secure job placement.',
        severity: 'critical' as any,
        confidence: Confidence.HIGH,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Refundable security deposit of $250 via cryptocurrency required before equipment dispatch.',
            reason: 'Upfront payment demanded prior to employment onboarding.',
          },
        ],
        source: 'deterministic' as any,
        limitations: [],
      },
      {
        id: 'threat-content.urgency',
        title: 'Artificial Urgency and High Pressure',
        description: 'Artificial 24-hour expiration countdown applied to force hasty applicant payment.',
        severity: 'high' as any,
        confidence: Confidence.HIGH,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Offer expires in 24 hours. Only 2 positions remaining.',
            reason: 'High pressure scarcity tactic commonly associated with recruitment advance-fee scams.',
          },
        ],
        source: 'deterministic' as any,
        limitations: [],
      },
      {
        id: 'threat-content.data_exposure',
        title: 'Premature Identity Document Harvesting',
        description: 'Mandatory upfront collection of passport scans and bank account numbers prior to formal interview.',
        severity: 'critical' as any,
        confidence: Confidence.HIGH,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Please upload front and back scans of your passport and enter your primary bank routing number.',
            reason: 'Sensitive KYC/financial data harvested prematurely without verified employer standing.',
          },
        ],
        source: 'deterministic' as any,
        limitations: [],
      },
    ],
    trust_dna: [
      {
        id: 'payment_risk',
        name: 'Payment Risk',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Demands $250 advance cryptocurrency deposit for equipment provisioning.',
        dimension_score: 4,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Refundable security deposit of $250 via cryptocurrency required',
            reason: 'Upfront fee requested',
          },
        ],
        limitations: [],
      },
      {
        id: 'identity_risk',
        name: 'Identity Risk',
        status: 'unknown' as any,
        confidence: Confidence.LOW,
        summary: 'No verified registrar ownership records detected.',
        dimension_score: 30,
        evidence: [],
        limitations: [],
      },
      {
        id: 'social_engineering_risk',
        name: 'Social Engineering Risk',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Artificial 24h scarcity timer deployed to coerce immediate payment.',
        dimension_score: 15,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Offer expires in 24 hours',
            reason: 'Scarcity urgency timer',
          },
        ],
        limitations: [],
      },
      {
        id: 'data_exposure_risk',
        name: 'Data Exposure Risk',
        status: 'warning_found' as any,
        confidence: Confidence.HIGH,
        summary: 'Premature harvesting of passport copies and banking routing numbers.',
        dimension_score: 8,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'upload front and back scans of your passport',
            reason: 'Sensitive document harvesting',
          },
        ],
        limitations: [],
      },
      {
        id: 'link_domain_risk',
        name: 'Link and Domain Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Local test page.',
        dimension_score: 80,
        evidence: [],
        limitations: [],
      },
      {
        id: 'evidence_confidence',
        name: 'Evidence Confidence',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'Corroborated across 3 deterministic high-severity heuristics.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
    ],
    proof_mode: [
      {
        finding_id: 'threat-content.payment_pressure',
        title: 'Mandatory Advance Deposit Demand',
        observed: 'Refundable security deposit of $250 via cryptocurrency required before equipment dispatch.',
        location: 'form > div.payment-instructions',
        why_it_matters: 'Legitimate employers provide equipment directly and never demand deposits from job candidates.',
        check_id: 'content.payment_pressure',
        is_deterministic: true,
        confidence: Confidence.HIGH,
        limitations: [],
      },
      {
        finding_id: 'threat-content.urgency',
        title: 'Artificial 24h Scarcity Timer',
        observed: 'Offer expires in 24 hours. Only 2 positions remaining.',
        location: 'header > span.urgency-badge',
        why_it_matters: 'Scammers manufacture false urgency to bypass victim critical thinking and legal verification.',
        check_id: 'content.urgency',
        is_deterministic: true,
        confidence: Confidence.HIGH,
        limitations: [],
      },
      {
        finding_id: 'threat-content.data_exposure',
        title: 'Premature KYC & Banking Collection',
        observed: 'Please upload front and back scans of your passport and enter your primary bank routing number.',
        location: 'fieldset.kyc-verification',
        why_it_matters: 'Harvested identity credentials are frequently used for synthetic identity theft and unauthorized bank debiting.',
        check_id: 'content.data_exposure',
        is_deterministic: true,
        confidence: Confidence.HIGH,
        limitations: [],
      },
    ],
    next_best_actions: [
      'DO NOT transfer any cryptocurrency or financial funds under any circumstances.',
      'DO NOT upload copies of government identification, passports, or banking credentials.',
      'Cease all direct communication with the recruiter across Telegram, WhatsApp, or unsolicited email.',
      'Report the domain and recruitment communication to the Federal Trade Commission (FTC) or local cyber fraud authority.',
    ],
    checks: {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure', 'content.urgency', 'content.credential_pressure', 'content.data_exposure'],
      not_executed: [],
      unavailable: [],
      failed: [],
    },
    limitations: [],
  },
  {
    request_id: 'demo-scen-3-ambiguous',
    status: 'completed',
    assessment_status: AssessmentStatus.CAUTION,
    score: 62,
    summary: 'Mixed signals detected: open-source community collective with unverified corporate registration and uncorroborated payroll escrows.',
    analyzed_url: 'http://localhost:8080/ambiguous.html',
    mode: AnalysisMode.PAGE,
    timestamp: new Date().toISOString(),
    findings: [
      {
        id: 'context-informal_entity',
        title: 'Unregistered Community Entity',
        description: 'Project is run by an informal decentralized collective without verified commercial registration.',
        severity: 'medium' as any,
        confidence: Confidence.MEDIUM,
        status: 'detected' as any,
        evidence: [
          {
            source: 'visible_text',
            excerpt: 'Nova Research Labs is an informal research initiative benchmarking open multimodal models.',
            reason: 'Absence of corporate registry records leaves applicant without clear legal recourse.',
          },
        ],
        source: 'ai_interpreted' as any,
        limitations: ['Decentralized and open-source groups often operate legitimately without corporate incorporation.'],
      },
    ],
    trust_dna: [
      {
        id: 'payment_risk',
        name: 'Payment Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No immediate upfront fee demands detected.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
      {
        id: 'identity_risk',
        name: 'Identity Risk',
        status: 'unknown' as any,
        confidence: Confidence.LOW,
        summary: 'Decentralized group identity unverified.',
        dimension_score: 45,
        evidence: [],
        limitations: ['Corporate registrar records unverified.'],
      },
      {
        id: 'social_engineering_risk',
        name: 'Social Engineering Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Standard project description without urgency timers.',
        dimension_score: 90,
        evidence: [],
        limitations: [],
      },
      {
        id: 'data_exposure_risk',
        name: 'Data Exposure Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'No sensitive document uploads requested upfront.',
        dimension_score: 95,
        evidence: [],
        limitations: [],
      },
      {
        id: 'link_domain_risk',
        name: 'Link and Domain Risk',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.HIGH,
        summary: 'Clean standard URL structure.',
        dimension_score: 98,
        evidence: [],
        limitations: [],
      },
      {
        id: 'evidence_confidence',
        name: 'Evidence Confidence',
        status: 'no_indicator_detected' as any,
        confidence: Confidence.MEDIUM,
        summary: 'Heuristic checks complete with moderate confidence.',
        dimension_score: 70,
        evidence: [],
        limitations: [],
      },
    ],
    proof_mode: [
      {
        finding_id: 'context-informal_entity',
        title: 'Unchartered Community Entity',
        observed: 'Nova Research Labs is an informal research initiative benchmarking open multimodal models.',
        location: 'body > section',
        why_it_matters: 'Grassroots projects lack corporate legal recourse if compensation disputes arise.',
        check_id: 'context.informal_entity',
        is_deterministic: false,
        confidence: Confidence.LOW,
        limitations: ['Open-source projects are often legitimate but require escrow verification.'],
      },
    ],
    next_best_actions: [
      'Confirm project legitimacy through public open-source code repositories.',
      'Clarify payment mechanisms and escrow arrangements before performing extensive work.',
    ],
    checks: {
      executed: ['url.ip_host', 'url.suspicious_tld', 'content.payment_pressure'],
      not_executed: [],
      unavailable: [],
      failed: [],
    },
    limitations: [],
  },
];

export type VerdictTone = 'clean' | 'caution' | 'threat' | 'unknown';

export interface DashboardVerdict {
  tone: VerdictTone;
  label: string;
}

/**
 * Derive the dashboard verdict from the report itself. A missing score is never
 * treated as a perfect score: without a score there is no clean claim to make.
 */
export function deriveVerdict(report: AnalysisReport): DashboardVerdict {
  switch (report.assessment_status) {
    case AssessmentStatus.ERROR:
      return { tone: 'unknown', label: 'SCAN INCOMPLETE' };
    case AssessmentStatus.INCONCLUSIVE:
      return { tone: 'unknown', label: 'INCONCLUSIVE' };
    case AssessmentStatus.SUSPICIOUS:
      return { tone: 'threat', label: 'CRITICAL THREAT DETECTED' };
    case AssessmentStatus.CAUTION:
      return { tone: 'caution', label: 'CAUTION / UNVERIFIED' };
    case AssessmentStatus.NEEDS_VERIFICATION:
      return { tone: 'caution', label: 'VERIFICATION REQUIRED' };
    default:
      break;
  }

  const score = typeof report.score === 'number' ? report.score : null;
  if (score === null) {
    return { tone: 'unknown', label: 'UNVERIFIED — NO SCORE' };
  }
  if (score < 50) {
    return { tone: 'threat', label: 'CRITICAL THREAT DETECTED' };
  }
  if (score < 85) {
    return { tone: 'caution', label: 'CAUTION / UNVERIFIED' };
  }
  return { tone: 'clean', label: 'CLEAN SIGNALS' };
}

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>(DEMO_REPORTS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const elapsedSeconds = useElapsedSeconds(isScanning);

  const handleCopyUrl = async () => {
    if (!report?.analyzed_url) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(report.analyzed_url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      }
    } catch {
      // Graceful fallback
    }
  };

  // Load latest report and scan history from runtime/storage & listen for live updates
  useEffect(() => {
    // 1. Check background service worker for active report
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: MessageType.GET_LATEST_REPORT }, (res) => {
        if (!chrome.runtime.lastError && res?.report) {
          setReport(res.report);
          setHistory((prev) => [res.report, ...prev.filter((p) => p.request_id !== res.report.request_id)]);
        }
      });
    }

    // 2. Check storage for cached reports
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.get(['credible_latest_report', 'credible_scan_history'], (res) => {
        if (res.credible_latest_report) {
          setReport((current) => current || res.credible_latest_report);
        } else {
          setReport((current) => current || DEMO_REPORTS[0]);
        }

        if (res.credible_scan_history && Array.isArray(res.credible_scan_history)) {
          setHistory((prev) => {
            const combined = [...res.credible_scan_history, ...prev];
            const unique = Array.from(new Map(combined.map((item) => [item.request_id, item])).values());
            return unique;
          });
        }
      });
    } else {
      setReport(DEMO_REPORTS[0]);
    }

    // 3. Listen for live SCAN_SUCCESS / SCAN_ERROR messages from background/sidepanel
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message: ExtensionMessage) => {
        if (message.type === MessageType.SCAN_SUCCESS && message.report) {
          setScanError(null);
          setReport(message.report);
          setHistory((prev) => [message.report, ...prev.filter((p) => p.request_id !== message.report.request_id)]);
        } else if (message.type === MessageType.SCAN_ERROR) {
          setScanError(message.error || 'The scan could not be completed. Reload the tab and try again.');
        }
      };
      chrome.runtime.onMessage.addListener(listener);
      return () => {
        chrome.runtime.onMessage.removeListener(listener);
      };
    }
  }, []);

  const handleSelectReport = (selected: AnalysisReport) => {
    setReport(selected);
  };

  const handleCopySummary = async () => {
    if (!report) return;
    try {
      const scoreLabel = typeof report.score === 'number' ? `${report.score}/100` : 'not available';
      const summaryText = `[Credible Forensic Dossier]\nTarget: ${report.analyzed_url}\nScore: ${scoreLabel}\nVerdict: ${report.assessment_status}\nSummary: ${report.summary}`;
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(summaryText);
        setCopiedSummary(true);
        setTimeout(() => setCopiedSummary(false), 2000);
      }
    } catch {
      // Graceful fallback
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      chrome.storage.local.remove(['credible_scan_history']);
    }
  };

  const handleTriggerScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanError(null);

    const finish = () => setIsScanning(false);

    const applyReport = (newReport: AnalysisReport) => {
      setReport(newReport);
      setHistory((prev) => [
        newReport,
        ...prev.filter((p) => p.request_id !== newReport.request_id),
      ]);

      if (chrome.storage?.local) {
        chrome.storage.local.set({
          credible_latest_report: newReport,
          credible_scan_history: [
            newReport,
            ...history.filter((p) => p.request_id !== newReport.request_id),
          ],
        });
      }
    };

    const runBackgroundScan = (tabId: number) => {
      if (!chrome.runtime?.sendMessage) {
        setScanError('The page could not be read. Reload the tab and try again.');
        finish();
        return;
      }

      chrome.runtime.sendMessage({ type: 'REQUEST_SCAN', tabId }, (bgResponse) => {
        if (chrome.runtime.lastError) {
          setScanError('The scanner did not respond. Reload the extension and try again.');
        } else if (bgResponse?.report) {
          applyReport(bgResponse.report);
        } else if (bgResponse?.alreadyScanning) {
          setScanError('A scan is already running. Wait for it to finish, then try again.');
        } else {
          setScanError(
            bgResponse?.error || 'The scan could not be completed. Reload the tab and try again.'
          );
        }
        finish();
      });
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          const targetTab =
            tabs.find(
              (t) =>
                t.url &&
                !t.url.startsWith('chrome-extension://') &&
                !t.url.startsWith('chrome://') &&
                !t.url.startsWith('about:')
            ) || tabs[0];

          if (
            !targetTab?.id ||
            !targetTab.url ||
            targetTab.url.startsWith('chrome-extension://') ||
            targetTab.url.startsWith('chrome://') ||
            targetTab.url.startsWith('about:')
          ) {
            setScanError(
              'Open a regular website tab, then scan again. Browser and extension pages cannot be inspected.'
            );
            finish();
            return;
          }

          const tabId = targetTab.id;

          chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_PAGE_CONTENT' }, async (response) => {
            const runtimeError = chrome.runtime?.lastError;

            if (!runtimeError && response?.success && response.data) {
              try {
                applyReport(await apiClient.analyzePage(response.data));
              } catch (error) {
                setScanError(mapErrorToUserMessage(error));
              } finally {
                finish();
              }
              return;
            }

            // The content script may not be injected yet; let the service worker retry.
            runBackgroundScan(tabId);
          });
        });
      } else {
        setScanError('Scanning is only available inside the installed extension.');
        finish();
      }
    } catch (error) {
      setScanError(mapErrorToUserMessage(error));
      finish();
    }
  };

  const handleSelectBenchmark = (scenarioId: string) => {
    const found = history.find((h) => h.request_id === scenarioId) || DEMO_REPORTS.find((d) => d.request_id === scenarioId);
    if (found) {
      handleSelectReport(found);
    }
  };

  if (!report) {
    return <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'monospace' }}>INITIALIZING COMMAND CENTER...</div>;
  }

  const score = typeof report.score === 'number' ? report.score : null;
  const verdict = deriveVerdict(report);
  const verdictTone = verdict.tone;
  const verdictLabel = verdict.label;
  const displayScore = score === null ? '-' : String(score);
  const scoreAria =
    score === null ? 'Trust score unavailable' : `Trust score ${score} out of 100`;

  const demoCase = report.request_id.match(/^demo-scen-(\d+)/);
  const caseId = demoCase
    ? demoCase[1].padStart(2, '0')
    : report.request_id.slice(0, 8).toUpperCase();

  const timestamp = new Date(report.timestamp);
  const scannedAt = Number.isNaN(timestamp.getTime())
    ? '—'
    : timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const executedCount = report.checks?.executed?.length || 0;
  // Only the finding sources are known per report; this is not a claim about
  // whether the AI ran, so label it as attribution rather than an engine mode.
  const engineLabel = (report.proof_mode || []).some(
    (entry) => entry.source && entry.source !== 'deterministic'
  )
    ? 'RULES + AI'
    : 'RULE-BASED ONLY';
  const evidenceConfidence = report.trust_dna?.find((dim) => dim.id === 'evidence_confidence')?.confidence;
  const evidenceLabel = evidenceConfidence
    ? evidenceConfidence.charAt(0).toUpperCase() + evidenceConfidence.slice(1)
    : '—';
  const modeLabel = report.mode === AnalysisMode.PAGE ? 'PAGE' : 'SELECTION';

  return (
    <div className="influency-app-shell" data-testid="dashboard-container">
      {/* Outer Floating Card Shell */}
      <div className="influency-window-frame">
        {/* Left Sidebar */}
        <InfluencySidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          threatCount={report.findings.length}
          historyCount={history.length}
          heuristicsCount={report.checks?.executed?.length || 0}
        />

        {/* Right Main Content Viewport */}
        <div className="influency-main-viewport">
          {/* Top Bar Navigation */}
          <InfluencyTopBar
            report={report}
            onScan={handleTriggerScan}
            isScanning={isScanning}
          />

          <h2 className="sr-only">Credible assessment workbench</h2>

          <ScanProgress
            active={isScanning}
            elapsedSeconds={elapsedSeconds}
            stage="Scanning page and running AI-assisted analysis"
            hint="A free-tier AI response can take up to about a minute."
            variant="inline"
            testId="dashboard-scan-progress"
          />

          {scanError && !isScanning && (
            <div className="scan-error" role="alert" data-testid="dashboard-scan-error">
              <span className="scan-error-mark" aria-hidden="true">
                !
              </span>
              <p className="scan-error-text">{scanError}</p>
              <button
                type="button"
                className="scan-error-dismiss"
                onClick={() => setScanError(null)}
              >
                DISMISS
              </button>
            </div>
          )}

          {/* Case-file verdict sheet: score, verdict, target, action, and telemetry in one document */}
          <section className="case-file" data-testid="dashboard-hero" id="forensic-workbench-section">
            <div className="case-file-bar">
              <span className="case-file-id">CASE {caseId}</span>
              <span className="case-file-spacer" />
              <span className="case-file-meta">SCANNED {scannedAt}</span>
            </div>

            <div className="case-file-body">
              <div className="case-verdict">
                <span className="case-label">TRUST INDEX</span>
                <div className="case-score-line">
                  <span
                    className={`case-score ${score === null ? 'case-score-unknown' : ''}`}
                    data-testid="dashboard-score-value"
                  >
                    {score === null ? 'Not scored' : displayScore}
                  </span>
                  {score !== null && <span className="case-score-denom">/ 100</span>}
                </div>
                <div
                  className={`case-meter case-meter-${verdictTone}`}
                  role="img"
                  aria-label={scoreAria}
                >
                  <span
                    className="case-meter-fill"
                    style={{ width: score === null ? '0%' : `${Math.max(0, Math.min(100, score))}%` }}
                  />
                </div>
                <div className="case-verdict-line">
                  <span
                    data-testid="dashboard-verdict-pill"
                    className={`case-verdict-word case-verdict-${verdictTone}`}
                  >
                    <span className="case-verdict-dot" aria-hidden="true" />
                    {verdictLabel}
                  </span>
                  <span className="case-verdict-count">
                    {verdictTone === 'unknown'
                      ? 'verdict not established'
                      : `${report.findings.length} ${
                          report.findings.length === 1 ? 'threat vector' : 'threat vectors'
                        }`}
                  </span>
                </div>
                <p className="case-reason">{report.summary}</p>
              </div>

              <aside className="case-evidence">
                <div className="case-evidence-head">
                  <span className="case-label">INVESTIGATION TARGET</span>
                  <span className="case-protocol">
                    {report.analyzed_url.startsWith('https') ? 'HTTPS' : 'HTTP'}
                  </span>
                </div>
                <div className="case-target">
                  <code className="case-target-url" title={report.analyzed_url}>
                    {report.analyzed_url}
                  </code>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={`case-copy ${copiedUrl ? 'is-copied' : ''}`}
                    title="Copy target URL"
                    aria-label="Copy target URL"
                  >
                    {copiedUrl ? 'COPIED' : 'COPY'}
                  </button>
                </div>

                <dl className="case-facts">
                  <div className="case-fact">
                    <dt>MODE</dt>
                    <dd>{modeLabel}</dd>
                  </div>
                  <div className="case-fact">
                    <dt>FINDING SOURCE</dt>
                    <dd>{engineLabel}</dd>
                  </div>
                  <div className="case-fact">
                    <dt>SCOPE</dt>
                    <dd>{executedCount} rules</dd>
                  </div>
                  <div className="case-fact">
                    <dt>EVIDENCE</dt>
                    <dd>{evidenceLabel}</dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  data-testid="dashboard-copy-summary-btn"
                  className="case-copy case-copy-summary"
                >
                  {copiedSummary ? 'COPIED' : 'COPY SUMMARY'}
                </button>
              </aside>
            </div>

            {report.next_best_actions.length > 0 && (
              <div className="case-action" data-testid="dashboard-priority-action">
                <span className="case-action-label">DO THIS FIRST</span>
                <p className="case-action-text">{report.next_best_actions[0]}</p>
                <button
                  type="button"
                  className="case-action-all"
                  onClick={() => {
                    const el = document.getElementById('next-actions-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                >
                  All {report.next_best_actions.length} actions
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              </div>
            )}

            <InfluencyTelemetryRail report={report} historyCount={history.length} />
          </section>

          {/* Reference cases: one ruled row, not another card */}
          <div className="case-scenarios">
            <span className="case-scenarios-label">REFERENCE CASES</span>
            <BenchmarkSwitcher selectedId={report.request_id} onSelect={handleSelectBenchmark} />
          </div>

          {/* 2-Column Forensic Deep-Dive Workbench */}
          <div className="influency-workbench-grid">
            {/* Left Column */}
            <div className="workbench-col">
              <FindingList findings={report.findings} />
              <TrustDnaPanel dimensions={report.trust_dna} />
              <ChecksAndLimitations checks={report.checks} limitations={report.limitations} />
            </div>

            {/* Right Column */}
            <div className="workbench-col">
              <NextBestActionList actions={report.next_best_actions} />
              <ProofModePanel entries={report.proof_mode} showEmptyCleanState={true} />
              <ScanLedger
                history={history}
                selectedId={report.request_id}
                onSelect={handleSelectReport}
                onClear={handleClearHistory}
              />
            </div>
          </div>

          {/* Full-width rules matrix: this table needs horizontal room */}
          <div className="influency-matrix-section">
            <HeuristicMatrix report={report} />
          </div>
        </div>
      </div>
    </div>
  );
};
