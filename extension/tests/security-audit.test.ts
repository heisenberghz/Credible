import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  extractPageData,
  extractSelectionData,
} from '../src/content/extractor';
import { buildPageRequest, buildSelectionRequest } from '../src/services/api-client';

describe('Task 17: Extension Privacy & Security Audit', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  describe('Privacy Audit: Network Payload Content Inspection', () => {
    it('ensures password, hidden inputs, and payment fields are completely excluded from payloads', () => {
      document.body.innerHTML = `
        <div class="user-portal">
          <h2>Account Security Dashboard</h2>
          <form id="sensitive-form">
            <input type="text" name="display_name" value="VisibleAlice" />
            <input type="password" name="account_password" value="SuperSecretPassword999!" />
            <input type="hidden" name="csrf_session" value="csrf-token-abc-xyz-123" />
            <input type="text" name="cardnumber" value="4111222233334444" />
            <input type="text" name="card_cvv" value="987" />
            <textarea name="user_pin">1234</textarea>
            <button type="submit">Update Settings</button>
          </form>
        </div>
      `;

      const pageData = extractPageData(document, window);
      const networkRequest = buildPageRequest(pageData);

      const serializedPayload = JSON.stringify(networkRequest);

      // Verify legitimate visible labels/buttons are present
      expect(pageData.visible_text).toContain('Account Security Dashboard');
      expect(pageData.visible_text).toContain('Update Settings');

      // CRITICAL PRIVACY ASSERTIONS: zero password/token/card leaks
      expect(serializedPayload).not.toContain('SuperSecretPassword999!');
      expect(serializedPayload).not.toContain('csrf-token-abc-xyz-123');
      expect(serializedPayload).not.toContain('4111222233334444');
      expect(serializedPayload).not.toContain('card_cvv');
      expect(serializedPayload).not.toContain('987');
      expect(serializedPayload).not.toContain('1234');
    });

    it('ensures selection payloads exclude full page DOM data and bound strictly to selection', () => {
      document.body.innerHTML = `
        <div id="unselected-region">
          <p>Confidential internal note: Project Chimera budget is $10M.</p>
        </div>
        <p id="selected-region">Suspicious claim: Transfer $100 fee now.</p>
      `;

      const selectedEl = document.getElementById('selected-region')!;
      const mockWin = {
        location: { href: 'https://example.com' },
        getSelection: () => ({
          toString: () => selectedEl.textContent || '',
          anchorNode: selectedEl.firstChild,
        }),
      } as unknown as Window;

      const selectionData = extractSelectionData(document, mockWin);
      const selectionRequest = buildSelectionRequest(selectionData);
      const serialized = JSON.stringify(selectionRequest);

      // Verify only selected text is included
      expect(serialized).toContain('Transfer $100 fee now');
      // Verify unselected text is NEVER leaked into the selection payload
      expect(serialized).not.toContain('Project Chimera budget');
      expect(selectionRequest.page).toBeNull();
    });
  });

  describe('Permission Audit: Manifest V3 Bounds', () => {
    const manifestPath = path.resolve(__dirname, '../public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    it('declares strictly necessary permissions only and avoids invasive privileges', () => {
      const allowedPermissions = ['activeTab', 'sidePanel', 'contextMenus', 'scripting'];

      // Must only contain allowed permissions
      for (const perm of manifest.permissions) {
        expect(allowedPermissions).toContain(perm);
      }
      expect(manifest.permissions.length).toBe(allowedPermissions.length);

      // Assert absence of invasive permissions
      const dangerousPermissions = [
        '<all_urls>',
        'cookies',
        'webRequest',
        'webRequestBlocking',
        'tabs',
        'management',
        'privacy',
        'proxy',
        'debugger',
      ];

      for (const dangerous of dangerousPermissions) {
        expect(manifest.permissions).not.toContain(dangerous);
      }
    });

    it('restricts host_permissions strictly to local backend endpoint', () => {
      expect(manifest.host_permissions).toBeDefined();
      expect(manifest.host_permissions).toEqual(['http://localhost:8000/*']);
    });
  });

  describe('Execution Guardrails: On-Demand Only', () => {
    it('verifies extractor is passive and contains zero automatic on-load triggers', () => {
      const extractorSource = fs.readFileSync(
        path.resolve(__dirname, '../src/content/extractor.ts'),
        'utf-8'
      );

      // Must not contain window.onload, DOMContentLoaded, or immediate execution on import
      expect(extractorSource).not.toMatch(/window\.addEventListener\(['"]DOMContentLoaded/);
      expect(extractorSource).not.toMatch(/window\.addEventListener\(['"]load/);
      expect(extractorSource).not.toMatch(/document\.addEventListener\(['"]DOMContentLoaded/);

      // Runs exclusively within onMessage or explicit function calls
      expect(extractorSource).toContain('chrome.runtime.onMessage.addListener');
    });
  });
});

