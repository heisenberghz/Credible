import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractPageData,
  extractVisibleText,
  extractLinks,
  extractSelectionData,
  isElementIgnoredOrHidden,
  MAX_VISIBLE_TEXT_LENGTH,
  MAX_LINKS,
  MAX_SELECTION_LENGTH,
} from '../src/content/extractor';

describe('Content Extractor', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.title = 'Test Page';
  });

  describe('Sensitive Field & Non-Content Exclusion', () => {
    it('never collects password or hidden input fields or values', () => {
      document.body.innerHTML = `
        <div id="main-content">
          <h1>Welcome to Secure Portal</h1>
          <form>
            <label for="username">Username</label>
            <input type="text" id="username" name="username" value="john_doe" />
            <label for="password">Password</label>
            <input type="password" id="password" name="password" value="SuperSecretPassword123!" />
            <input type="hidden" name="csrf_token" value="sensitive_csrf_999" />
            <input type="text" name="cvv_code" value="123" />
            <input type="text" name="creditcard" value="4111222233334444" />
            <button type="submit">Sign In</button>
          </form>
        </div>
      `;

      const result = extractVisibleText(document, window);

      expect(result.text).toContain('Welcome to Secure Portal');
      expect(result.text).toContain('Sign In');
      // Passwords and tokens must NEVER appear
      expect(result.text).not.toContain('SuperSecretPassword123!');
      expect(result.text).not.toContain('sensitive_csrf_999');
      expect(result.text).not.toContain('4111222233334444');
    });

    it('ignores scripts, styles, noscript, and template contents', () => {
      document.body.innerHTML = `
        <div>Visible announcement text</div>
        <script>const maliciousInjection = "alert('xss')";</script>
        <style>.hidden { display: none; }</style>
        <noscript>JavaScript is required</noscript>
        <template><span>Template secret</span></template>
        <svg><text>SVG internal vector</text></svg>
      `;

      const result = extractVisibleText(document, window);

      expect(result.text).toBe('Visible announcement text');
      expect(result.text).not.toContain('maliciousInjection');
      expect(result.text).not.toContain('hidden');
      expect(result.text).not.toContain('JavaScript is required');
      expect(result.text).not.toContain('Template secret');
      expect(result.text).not.toContain('SVG internal vector');
    });

    it('ignores elements with display:none, visibility:hidden, or aria-hidden=true', () => {
      document.body.innerHTML = `
        <div>Legitimate public text</div>
        <div style="display: none;">Invisible hidden payload</div>
        <div style="visibility: hidden;">Invisible stealth text</div>
        <div aria-hidden="true">Screen-reader invisible text</div>
      `;

      const result = extractVisibleText(document, window);

      expect(result.text).toContain('Legitimate public text');
      expect(result.text).not.toContain('Invisible hidden payload');
      expect(result.text).not.toContain('Invisible stealth text');
      expect(result.text).not.toContain('Screen-reader invisible text');
    });

    it('correctly identifies ignored elements via isElementIgnoredOrHidden', () => {
      const script = document.createElement('script');
      expect(isElementIgnoredOrHidden(script, window)).toBe(true);

      const passInput = document.createElement('input');
      passInput.setAttribute('type', 'password');
      expect(isElementIgnoredOrHidden(passInput, window)).toBe(true);

      const hiddenInput = document.createElement('input');
      hiddenInput.setAttribute('type', 'hidden');
      expect(isElementIgnoredOrHidden(hiddenInput, window)).toBe(true);

      const cvvInput = document.createElement('input');
      cvvInput.setAttribute('name', 'card_cvv');
      expect(isElementIgnoredOrHidden(cvvInput, window)).toBe(true);

      const div = document.createElement('div');
      div.textContent = 'Normal text';
      expect(isElementIgnoredOrHidden(div, window)).toBe(false);
    });
  });

  describe('Extraction Bounds and Truncation', () => {
    it('bounds visible text to 50,000 characters and sets truncated metadata', () => {
      // Create text exceeding 50,000 chars
      const repeatCount = 6000;
      const longSentence = 'Defensive security intelligence verification test. '; // 51 chars
      document.body.innerHTML = `<p>${longSentence.repeat(repeatCount)}</p>`;

      const result = extractPageData(document, window);

      expect(result.visible_text.length).toBeLessThanOrEqual(MAX_VISIBLE_TEXT_LENGTH);
      expect(result.visible_text.length).toBe(MAX_VISIBLE_TEXT_LENGTH);
      expect(result.metadata.truncated).toBe(true);
      expect(result.metadata.character_count).toBe(MAX_VISIBLE_TEXT_LENGTH);
    });

    it('bounds link collection to 100 links and rejects non-http protocols', () => {
      const linkElements: string[] = [];
      // Generate 120 links
      for (let i = 0; i < 120; i++) {
        linkElements.push(`<a href="https://example.com/item-${i}">Link ${i}</a>`);
      }
      // Add dangerous / non-http links
      linkElements.push('<a href="javascript:alert(1)">Dangerous JS Link</a>');
      linkElements.push('<a href="data:text/html,bad">Data Link</a>');
      linkElements.push('<a href="#internal-anchor">Anchor Link</a>');

      document.body.innerHTML = `<div>${linkElements.join('\n')}</div>`;

      const links = extractLinks(document, window);

      expect(links.length).toBe(MAX_LINKS);
      expect(links.length).toBe(100);

      // Verify no non-http links were captured
      for (const link of links) {
        expect(link.href.startsWith('http://') || link.href.startsWith('https://')).toBe(true);
      }
    });

    it('truncates excessively long link text and URLs', () => {
      const veryLongText = 'A'.repeat(300);
      const veryLongQuery = 'param=' + 'X'.repeat(2500);
      document.body.innerHTML = `
        <a href="https://example.com/test?${veryLongQuery}">${veryLongText}</a>
      `;

      const links = extractLinks(document, window);
      expect(links.length).toBe(1);
      expect(links[0].text.length).toBeLessThanOrEqual(154); // 150 + '...'
      expect(links[0].href.length).toBeLessThanOrEqual(2000);
    });
  });

  describe('Empty and Edge-Case Pages', () => {
    it('handles empty document gracefully', () => {
      document.body.innerHTML = '';
      const result = extractPageData(document, window);

      expect(result.visible_text).toBe('');
      expect(result.links).toEqual([]);
      expect(result.metadata.truncated).toBe(false);
      expect(result.metadata.character_count).toBe(0);
    });

    it('handles whitespace-only document cleanly', () => {
      document.body.innerHTML = '   \n\t  <p>   </p>  <div>  \n </div> ';
      const result = extractPageData(document, window);

      expect(result.visible_text).toBe('');
      expect(result.metadata.truncated).toBe(false);
    });

    it('preserves clean structure and block spacing between paragraphs and headings', () => {
      document.body.innerHTML = `
        <h1>Urgent Account Notice</h1>
        <p>Your payment is overdue.</p>
        <p>Please resolve immediately.</p>
      `;

      const result = extractVisibleText(document, window);

      expect(result.text).toBe(
        'Urgent Account Notice\nYour payment is overdue.\nPlease resolve immediately.'
      );
    });
  });

  describe('Text Selection Extraction', () => {
    it('extracts text selection and bounds it to 5,000 characters', () => {
      const longSelection = 'Security notice '.repeat(400); // ~6400 chars
      const mockWin = {
        location: { href: 'https://example.com/article' },
        getSelection: () => ({
          toString: () => longSelection,
          anchorNode: null,
        }),
      } as unknown as Window;

      const result = extractSelectionData(document, mockWin);

      expect(result.url).toBe('https://example.com/article');
      expect(result.text.length).toBeLessThanOrEqual(MAX_SELECTION_LENGTH);
      expect(result.metadata.truncated).toBe(true);
    });

    it('identifies nearest link when text is selected inside an anchor', () => {
      const anchor = document.createElement('a');
      anchor.href = 'https://example.com/verify-now';
      anchor.textContent = 'Verify your account credentials here';
      document.body.appendChild(anchor);

      const textNode = anchor.firstChild!;
      const mockWin = {
        location: { href: 'https://example.com/page' },
        getSelection: () => ({
          toString: () => 'Verify your account credentials',
          anchorNode: textNode,
        }),
      } as unknown as Window;

      const result = extractSelectionData(document, mockWin);

      expect(result.text).toBe('Verify your account credentials');
      expect(result.link).toBeDefined();
      expect(result.link?.href).toBe('https://example.com/verify-now');
    });
  });
});

