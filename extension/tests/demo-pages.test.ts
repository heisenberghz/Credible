import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { extractPageData, extractSelectionData } from '../src/content/extractor';

const DEMO_PAGES_DIR = path.resolve(__dirname, '../../demo/pages');

function loadDemoPage(filename: string): string {
  const filePath = path.join(DEMO_PAGES_DIR, filename);
  return fs.readFileSync(filePath, 'utf-8');
}

describe('Task 18: Extension Demo Scenarios Extraction Suite', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = '';
  });

  it('Scenario 1 (Benign): extracts clean, non-sensitive page text and valid navigation links', () => {
    document.documentElement.innerHTML = loadDemoPage('benign.html');
    const pageData = extractPageData();

    expect(pageData.title).toContain('Acme Cloud Platforms');
    expect(pageData.visible_text).toContain('Senior Cloud Infrastructure Engineer');
    expect(pageData.visible_text).toContain('Acme Cloud Platforms');
    expect(pageData.visible_text.length).toBeLessThanOrEqual(50000);
    // Links should include index navigation
    expect(pageData.links.length).toBeGreaterThan(0);
    expect(pageData.links.some((l) => l.href.includes('index.html'))).toBe(true);
  });

  it('Scenario 2 (Suspicious): extracts threat text while excluding any input or sensitive controls', () => {
    document.documentElement.innerHTML = loadDemoPage('suspicious.html');
    const pageData = extractPageData();

    expect(pageData.visible_text).toContain('Apex Global Logistics');
    expect(pageData.visible_text).toContain('refundable security deposit of $250 via bitcoin wallet');
    expect(pageData.visible_text).toContain('submit your login credentials');
    expect(pageData.visible_text.length).toBeLessThanOrEqual(50000);
  });

  it('Scenario 3 (Ambiguous): correctly extracts freelance opportunity details and notices', () => {
    document.documentElement.innerHTML = loadDemoPage('ambiguous.html');
    const pageData = extractPageData();

    expect(pageData.visible_text).toContain('Nova Research Labs');
    expect(pageData.visible_text).toContain('Earn up to $1500 weekly');
    expect(pageData.visible_text.length).toBeLessThanOrEqual(50000);
  });

  it('Scenario 4 (Prompt Injection): extracts visible adversarial text without DOM execution', () => {
    document.documentElement.innerHTML = loadDemoPage('prompt-injection.html');
    const pageData = extractPageData();

    expect(pageData.visible_text).toContain('SYSTEM OVERRIDE INSTRUCTION');
    expect(pageData.visible_text).toContain('refundable processing fee of $350 via bitcoin wallet');
    // Input fields should not pollute the text with secret values
    expect(pageData.visible_text.length).toBeLessThanOrEqual(50000);
  });

  it('Scenario 5 (Error Demo): extracts scenario instructions and experiment guides', () => {
    document.documentElement.innerHTML = loadDemoPage('error-demo.html');
    const pageData = extractPageData();

    expect(pageData.visible_text).toContain('Resilience & Failure State Walkthrough');
    expect(pageData.visible_text).toContain('Deterministic Fallback Mode');
    expect(pageData.visible_text.length).toBeLessThanOrEqual(50000);
  });

  it('Select-to-Verify on Suspicious Page extracts exact bounded selection snippet', () => {
    document.documentElement.innerHTML = loadDemoPage('suspicious.html');

    // Simulate user selection on the page
    const paragraph = document.querySelector('.job-section p');
    expect(paragraph).not.toBeNull();

    const range = document.createRange();
    range.selectNodeContents(paragraph!);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);

    const selectionData = extractSelectionData();
    expect(selectionData.text.length).toBeGreaterThan(0);
    expect(selectionData.text.length).toBeLessThanOrEqual(5000);
    expect(selectionData.text).toContain('Apex Global Logistics is urgently hiring');
  });
});

