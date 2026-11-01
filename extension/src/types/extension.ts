/**
 * Extension internal messaging and state machine types
 */

import { AnalysisReport, ErrorResponse } from './analysis';

export type ScanLifecycleState = 'idle' | 'extracting' | 'analyzing' | 'completed' | 'failed';

export enum MessageType {
  REQUEST_SCAN = 'REQUEST_SCAN',
  SCAN_PROGRESS = 'SCAN_PROGRESS',
  SCAN_SUCCESS = 'SCAN_SUCCESS',
  SCAN_ERROR = 'SCAN_ERROR',
  OPEN_SIDEPANEL = 'OPEN_SIDEPANEL',
  GET_LATEST_REPORT = 'GET_LATEST_REPORT',
}

export interface RequestScanMessage {
  type: MessageType.REQUEST_SCAN;
  tabId?: number;
}

export interface ScanProgressMessage {
  type: MessageType.SCAN_PROGRESS;
  state: ScanLifecycleState;
  statusText: string;
}

export interface ScanSuccessMessage {
  type: MessageType.SCAN_SUCCESS;
  report: AnalysisReport;
}

export interface ScanErrorMessage {
  type: MessageType.SCAN_ERROR;
  error: string;
  detail?: ErrorResponse | null;
}

export interface OpenSidePanelMessage {
  type: MessageType.OPEN_SIDEPANEL;
  tabId?: number;
}

export interface GetLatestReportMessage {
  type: MessageType.GET_LATEST_REPORT;
}

export type ExtensionMessage =
  | RequestScanMessage
  | ScanProgressMessage
  | ScanSuccessMessage
  | ScanErrorMessage
  | OpenSidePanelMessage
  | GetLatestReportMessage;

