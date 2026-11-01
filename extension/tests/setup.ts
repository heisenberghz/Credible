import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Minimal mock for Chrome Extension API in JSDOM environment
if (typeof (globalThis as any).chrome === 'undefined') {
  (globalThis as any).chrome = {
    runtime: {
      sendMessage: vi.fn(),
      onMessage: {
        addListener: vi.fn(),
        removeListener: vi.fn(),
      },
    },
    tabs: {
      query: vi.fn().mockResolvedValue([{ id: 1, url: 'https://example.com' }]),
      sendMessage: vi.fn(),
    },
    sidePanel: {
      open: vi.fn().mockResolvedValue(undefined),
    },
    contextMenus: {
      create: vi.fn(),
      onClicked: {
        addListener: vi.fn(),
      },
    },
  };
}

