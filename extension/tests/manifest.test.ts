import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Extension Manifest V3', () => {
  const manifestPath = path.resolve(__dirname, '../public/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  it('uses Manifest Version 3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  it('contains expected branding and metadata', () => {
    expect(manifest.name).toBe('Credible');
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.description).toBeDefined();
  });

  it('declares only necessary permissions and avoids excessive privileges', () => {
    const requiredPermissions = ['activeTab', 'sidePanel', 'contextMenus', 'scripting'];
    expect(manifest.permissions).toEqual(expect.arrayContaining(requiredPermissions));
    expect(manifest.permissions.length).toBe(requiredPermissions.length);
  });

  it('defines correct entry points for popup, sidepanel, and background service worker', () => {
    expect(manifest.action.default_popup).toBe('src/popup/index.html');
    expect(manifest.side_panel.default_path).toBe('src/sidepanel/index.html');
    expect(manifest.background.service_worker).toBe('background.js');
    expect(manifest.background.type).toBe('module');
  });

  it('specifies icons for 16, 48, and 128 sizes and files exist', () => {
    expect(manifest.icons).toBeDefined();
    for (const size of ['16', '48', '128']) {
      expect(manifest.icons[size]).toBe(`icons/icon-${size}.png`);
      const iconFile = path.resolve(__dirname, '../public', manifest.icons[size]);
      expect(fs.existsSync(iconFile)).toBe(true);
    }
  });
});

