/**
 * Credible Extension - Content Extraction Script
 * Extracts visible DOM text and links with strict sensitive data exclusion safeguards.
 * ONLY executes upon explicit user action (never runs unprompted).
 */

import type {
  ExtractedPageResult,
  ExtractedSelectionResult,
  ExtensionMessage,
} from '../types/extension';
import type { LinkItem } from '../types/analysis';

export const MAX_VISIBLE_TEXT_LENGTH = 50000;
export const MAX_LINKS = 100;
export const MAX_LINK_TEXT_LENGTH = 150;
export const MAX_URL_LENGTH = 2000;
export const MAX_SELECTION_LENGTH = 5000;

// Non-content and invisible tags
const IGNORED_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'IFRAME',
  'OBJECT',
  'EMBED',
  'SVG',
  'CANVAS',
  'AUDIO',
  'VIDEO',
]);

// Block tags where spacing/newlines should be inserted
const BLOCK_TAGS = new Set([
  'ADDRESS', 'ARTICLE', 'ASIDE', 'BLOCKQUOTE', 'DETAILS', 'DIALOG',
  'DD', 'DIV', 'DL', 'DT', 'FIELDSET', 'FIGCAPTION', 'FIGURE',
  'FOOTER', 'FORM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HEADER',
  'HGROUP', 'HR', 'LI', 'MAIN', 'NAV', 'P', 'PRE', 'SECTION',
  'TABLE', 'TR', 'UL', 'OL'
]);

// Patterns matching sensitive / credential / payment attributes
const SENSITIVE_ATTR_PATTERN = /(?:password|passwd|pwd|pass|creditcard|cardnumber|cvv|cvc|security-code|ssn|token|secret|pin)/i;

/**
 * Determine if an element is hidden or sensitive.
 */
export function isElementIgnoredOrHidden(el: Element, win: Window = window): boolean {
  const upperTag = (el.tagName || '').toUpperCase();
  if (
    IGNORED_TAGS.has(upperTag) ||
    (typeof el.closest === 'function' && el.closest('svg'))
  ) {
    return true;
  }

  // Check aria-hidden
  if (el.getAttribute('aria-hidden') === 'true') {
    return true;
  }

  // Sensitive input safeguards: password, hidden inputs, credit card fields
  if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    const inputType = (el.getAttribute('type') || '').toLowerCase();
    if (inputType === 'password' || inputType === 'hidden') {
      return true;
    }

    const name = el.getAttribute('name') || '';
    const id = el.getAttribute('id') || '';
    const autocomplete = el.getAttribute('autocomplete') || '';
    if (
      SENSITIVE_ATTR_PATTERN.test(name) ||
      SENSITIVE_ATTR_PATTERN.test(id) ||
      SENSITIVE_ATTR_PATTERN.test(autocomplete)
    ) {
      return true;
    }
  }

  // Check CSS visibility if available in window environment
  if (typeof win.getComputedStyle === 'function') {
    try {
      const style = win.getComputedStyle(el);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        return true;
      }
    } catch {
      // In non-standard environments, rely on attributes
    }
  }

  // Inline style fallback
  const htmlEl = el as HTMLElement;
  if (htmlEl.style) {
    if (
      htmlEl.style.display === 'none' ||
      htmlEl.style.visibility === 'hidden' ||
      htmlEl.style.opacity === '0'
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Extract visible text from the document root.
 * Never inspects form values or sensitive fields.
 */
export function extractVisibleText(doc: Document = document, win: Window = window): {
  text: string;
  truncated: boolean;
} {
  const root = doc.body || doc.documentElement;
  if (!root) {
    return { text: '', truncated: false };
  }

  const textChunks: string[] = [];
  let totalLength = 0;
  let isTruncated = false;

  function traverse(node: Node) {
    if (isTruncated) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const content = node.textContent?.replace(/\s+/g, ' ') || '';
      if (content.trim().length > 0) {
        if (totalLength + content.length > MAX_VISIBLE_TEXT_LENGTH) {
          const remaining = MAX_VISIBLE_TEXT_LENGTH - totalLength;
          if (remaining > 0) {
            textChunks.push(content.slice(0, remaining));
            totalLength += remaining;
          }
          isTruncated = true;
          return;
        } else {
          textChunks.push(content);
          totalLength += content.length;
        }
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      if (isElementIgnoredOrHidden(element, win)) {
        return; // Skip element and children
      }

      const isBlock = BLOCK_TAGS.has(element.tagName);
      if (isBlock && textChunks.length > 0 && textChunks[textChunks.length - 1] !== '\n') {
        textChunks.push('\n');
      }

      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
        if (isTruncated) break;
      }

      if (isBlock && textChunks.length > 0 && textChunks[textChunks.length - 1] !== '\n') {
        textChunks.push('\n');
      }
    }
  }

  traverse(root);

  // Normalize newlines and excess whitespace
  let fullText = textChunks
    .join('')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();

  if (fullText.length > MAX_VISIBLE_TEXT_LENGTH) {
    fullText = fullText.slice(0, MAX_VISIBLE_TEXT_LENGTH);
    isTruncated = true;
  }

  return { text: fullText, truncated: isTruncated };
}

/**
 * Extract links with text and href (max 100 links).
 * Strictly filters to http/https and ignores javascript:/data: links.
 */
export function extractLinks(doc: Document = document, win: Window = window): LinkItem[] {
  const anchors = doc.querySelectorAll('a[href]');
  const links: LinkItem[] = [];
  const seenHrefs = new Set<string>();

  for (let i = 0; i < anchors.length && links.length < MAX_LINKS; i++) {
    const a = anchors[i] as HTMLAnchorElement;

    // Check visibility
    if (isElementIgnoredOrHidden(a, win)) {
      continue;
    }

    const rawHref = a.getAttribute('href') || '';
    const trimmedHref = rawHref.trim();
    if (!trimmedHref || trimmedHref.startsWith('#')) {
      continue;
    }

    // Only allow http/https protocols
    let fullUrl = '';
    try {
      const resolved = new URL(trimmedHref, doc.baseURI || win.location.href);
      if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
        continue; // Discard javascript:, mailto:, tel:, data:
      }
      fullUrl = resolved.href;
    } catch {
      continue; // Malformed URL
    }

    if (fullUrl.length > MAX_URL_LENGTH) {
      fullUrl = fullUrl.slice(0, MAX_URL_LENGTH);
    }

    if (seenHrefs.has(fullUrl)) {
      continue;
    }
    seenHrefs.add(fullUrl);

    // Sanitize link text
    let linkText = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (linkText.length > MAX_LINK_TEXT_LENGTH) {
      linkText = linkText.slice(0, MAX_LINK_TEXT_LENGTH) + '...';
    }

    links.push({
      text: linkText,
      href: fullUrl,
    });
  }

  return links;
}

/**
 * Extract complete page data from the active tab.
 */
export function extractPageData(doc: Document = document, win: Window = window): ExtractedPageResult {
  const url = win.location?.href || doc.location?.href || '';
  const title = (doc.title || '').trim();
  const { text: visible_text, truncated } = extractVisibleText(doc, win);
  const links = extractLinks(doc, win);

  return {
    url,
    title,
    visible_text,
    links,
    metadata: {
      truncated,
      character_count: visible_text.length,
      link_count: links.length,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Extract active user text selection.
 */
export function extractSelectionData(doc: Document = document, win: Window = window): ExtractedSelectionResult {
  const url = win.location?.href || doc.location?.href || '';
  const selection = win.getSelection ? win.getSelection()?.toString() || '' : '';
  const trimmed = selection.trim();

  let text = trimmed;
  let truncated = false;
  if (text.length > MAX_SELECTION_LENGTH) {
    text = text.slice(0, MAX_SELECTION_LENGTH);
    truncated = true;
  }

  // Attempt to find closest anchor link to selection if applicable
  let link: LinkItem | null = null;
  if (win.getSelection && win.getSelection()?.anchorNode) {
    const anchorNode = win.getSelection()?.anchorNode;
    const parentEl = anchorNode?.nodeType === Node.ELEMENT_NODE
      ? (anchorNode as Element)
      : anchorNode?.parentElement;

    const closestA = parentEl?.closest('a');
    if (closestA && closestA.href) {
      try {
        const resolved = new URL(closestA.href, doc.baseURI || win.location.href);
        if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
          link = {
            text: (closestA.textContent || '').trim().slice(0, MAX_LINK_TEXT_LENGTH),
            href: resolved.href.slice(0, MAX_URL_LENGTH),
          };
        }
      } catch {
        // Ignore malformed link
      }
    }
  }

  return {
    url,
    text,
    link,
    metadata: {
      truncated,
      character_count: text.length,
      link_count: link ? 1 : 0,
      timestamp: new Date().toISOString(),
    },
  };
}

const MSG_EXTRACT_PAGE_CONTENT = 'EXTRACT_PAGE_CONTENT';
const MSG_EXTRACT_SELECTION_CONTENT = 'EXTRACT_SELECTION_CONTENT';

// Runtime message listener for on-demand execution (ONLY triggers on explicit message)
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(
    (
      message: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (res: any) => void
    ) => {
      try {
        if (message.type === MSG_EXTRACT_PAGE_CONTENT) {
          const pageData = extractPageData(document, window);
          sendResponse({ success: true, data: pageData });
          return false;
        }

        if (message.type === MSG_EXTRACT_SELECTION_CONTENT) {
          const selectionData = extractSelectionData(document, window);
          sendResponse({ success: true, data: selectionData });
          return false;
        }
      } catch (err) {
        sendResponse({ success: false, error: String(err) });
        return false;
      }
      return false;
    }
  );
}
