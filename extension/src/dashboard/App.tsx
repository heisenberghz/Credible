import React, { useEffect, useState } from 'react';
import { AnalysisReport, AssessmentStatus, AnalysisMode, Confidence } from '../types/analysis';
import { ExtensionMessage, MessageType } from '../types/extension';
import { InfluencySidebar } from './components/InfluencySidebar';
import { InfluencyTopBar } from './components/InfluencyTopBar';
import { InfluencyKpiRow } from './components/InfluencyKpiRow';
import { InfluencyStatisticsCard } from './components/InfluencyStatisticsCard';
import { InfluencyVisitorsCard } from './components/InfluencyVisitorsCard';
import { BenchmarkSwitcher } from './components/BenchmarkSwitcher';
import { HeuristicMatrix } from './components/HeuristicMatrix';
import { ScanLedger } from './components/ScanLedger';
import { FindingList } from '../sidepanel/components/FindingList';
import { ChecksAndLimitations } from '../sidepanel/components/ChecksAndLimitations';
import { TrustDnaPanel } from '../sidepanel/components/TrustDnaPanel';
import { ProofModePanel } from '../sidepanel/components/ProofModePanel';
import { NextBestActionList } from '../sidepanel/components/NextBestActionList';
import { ScoreGauge } from '../sidepanel/components/ScoreGauge';
import { apiClient } from '../services/api-client';

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

export const DashboardApp: React.FC = () => {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [history, setHistory] = useState<AnalysisReport[]>(DEMO_REPORTS);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('donators');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

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

    // 3. Listen for live SCAN_SUCCESS messages from background/sidepanel
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      const listener = (message: ExtensionMessage) => {
        if (message.type === MessageType.SCAN_SUCCESS && message.report) {
          setReport(message.report);
          setHistory((prev) => [message.report, ...prev.filter((p) => p.request_id !== message.report.request_id)]);
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
      const summaryText = `[Credible Forensic Dossier]\nTarget: ${report.analyzed_url}\nScore: ${report.score ?? 100}/100\nVerdict: ${report.assessment_status}\nSummary: ${report.summary}`;
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

    try {
      if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        chrome.tabs.query({ currentWindow: true }, async (tabs) => {
          const targetTab = tabs.find(
            (t) => t.url && !t.url.startsWith('chrome-extension://') && !t.url.startsWith('chrome://') && !t.url.startsWith('about:')
          ) || tabs[0];

          if (!targetTab?.id || !targetTab.url || targetTab.url.startsWith('chrome-extension://') || targetTab.url.startsWith('chrome://')) {
            alert('To scan a live web page, please open a website in a tab (e.g. any job board, article, or demo page) and click Scan.');
            setIsScanning(false);
            return;
          }

          chrome.tabs.sendMessage(targetTab.id, { type: 'EXTRACT_PAGE_CONTENT' }, async (response) => {
            if (response && response.success && response.data) {
              try {
                const newReport = await apiClient.analyzePage(response.data);

                setReport(newReport);
                setHistory((prev) => [newReport, ...prev.filter((p) => p.request_id !== newReport.request_id)]);

                if (chrome.storage?.local) {
                  chrome.storage.local.set({
                    credible_latest_report: newReport,
                    credible_scan_history: [newReport, ...history],
                  });
                }
              } catch (e) {
                console.error('Scan failed:', e);
              }
            } else {
              if (chrome.runtime?.sendMessage) {
                chrome.runtime.sendMessage({ type: 'REQUEST_SCAN', tabId: targetTab.id }, (bgResponse) => {
                  if (bgResponse && bgResponse.report) {
                    setReport(bgResponse.report);
                    setHistory((prev) => [bgResponse.report, ...prev.filter((p) => p.request_id !== bgResponse.report.request_id)]);
                  }
                });
              }
            }
            setIsScanning(false);
          });
        });
      } else {
        setTimeout(() => {
          setIsScanning(false);
        }, 800);
      }
    } catch {
      setIsScanning(false);
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

  const score = report.score ?? 100;
  const isThreat = report.assessment_status === AssessmentStatus.SUSPICIOUS || score < 50;
  const isCaution = report.assessment_status === AssessmentStatus.CAUTION || (score >= 50 && score < 85);

  let verdictBg = '#ECFDF5';
  let verdictText = '#065F46';
  let verdictBorder = '#A7F3D0';
  let verdictLabel = 'CLEAN SIGNALS';

  if (isThreat) {
    verdictBg = '#FFF1F2';
    verdictText = '#9F1239';
    verdictBorder = '#FECDD3';
    verdictLabel = 'CRITICAL THREAT DETECTED';
  } else if (isCaution) {
    verdictBg = '#FFFBEB';
    verdictText = '#92400E';
    verdictBorder = '#FDE68A';
    verdictLabel = 'CAUTION / UNVERIFIED';
  }

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
        />

        {/* Right Main Content Viewport */}
        <div className="influency-main-viewport">
          {/* Top Bar Navigation */}
          <InfluencyTopBar
            report={report}
            onScan={handleTriggerScan}
            isScanning={isScanning}
          />

          {/* 4 KPI Cards Row */}
          <InfluencyKpiRow report={report} historyCount={history.length} />

          {/* 2-Column Analytics Deck: Statistics & Visitors */}
          <div className="influency-analytics-deck">
            <InfluencyStatisticsCard report={report} />
            <InfluencyVisitorsCard report={report} />
          </div>

          {/* Ground-Truth Calibration Benchmarks Dock */}
          <div style={{ marginTop: '24px', marginBottom: '16px' }}>
            <BenchmarkSwitcher selectedId={report.request_id} onSelect={handleSelectBenchmark} />
          </div>

          {/* Forensic Horizon Dial & Narrative Card */}
          <section className="influency-forensic-horizon" data-testid="dashboard-hero" id="forensic-workbench-section">
            <div className="horizon-flex-row">
              <div style={{ width: '84px', height: '84px', flexShrink: 0 }}>
                <ScoreGauge score={score} size={84} variant="dial-only" />
              </div>
              <div className="horizon-verdict-info">
                <span className="horizon-micro-label">OVERALL VERDICT</span>
                <span
                  data-testid="dashboard-verdict-pill"
                  className="horizon-verdict-pill"
                  style={{
                    backgroundColor: verdictBg,
                    color: verdictText,
                    borderColor: verdictBorder,
                  }}
                >
                  {verdictLabel}
                </span>
                <div className="horizon-threat-count" style={{ color: isThreat ? '#E11D48' : '#059669' }}>
                  {report.findings.length > 0 ? (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>{report.findings.length} Threat Vectors Triggered</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>0 Threat Vectors Triggered</span>
                    </>
                  )}
                </div>
              </div>

              {/* Target URL Telemetry */}
              <div className="horizon-target-telemetry">
                <div className="horizon-panel-header">
                  <span className="horizon-micro-label">INVESTIGATION TARGET</span>
                  <span className="horizon-protocol-badge">
                    {report.analyzed_url.startsWith('https') ? 'HTTPS' : 'HTTP'}
                  </span>
                </div>
                <div className="horizon-url-box-wrapper">
                  <div className="horizon-url-box" title={report.analyzed_url}>
                    <code className="horizon-url-code">{report.analyzed_url}</code>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className={`btn-url-copy ${copiedUrl ? 'copied' : ''}`}
                    title="Copy target URL"
                    aria-label="Copy target URL"
                  >
                    {copiedUrl ? 'COPIED' : 'COPY'}
                  </button>
                </div>
              </div>
            </div>

            {/* Executive Narrative Summary Box */}
            <div className="influency-narrative-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span className="horizon-micro-label">EXECUTIVE THREAT NARRATIVE</span>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  data-testid="dashboard-copy-summary-btn"
                  className="btn-copy-mini"
                >
                  {copiedSummary ? 'Copied' : 'Copy Summary'}
                </button>
              </div>
              <p className="influency-narrative-text">{report.summary}</p>
            </div>
          </section>

          {/* 2-Column Forensic Deep-Dive Workbench */}
          <div className="influency-workbench-grid">
            {/* Left Column */}
            <div className="workbench-col">
              <FindingList findings={report.findings} />
              <TrustDnaPanel dimensions={report.trust_dna} />
              <HeuristicMatrix report={report} />
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
        </div>
      </div>
    </div>
  );
};
