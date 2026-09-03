import { describe, it, expect } from 'vitest';
import { linkSanitizer } from '../../src/services/link-sanitizer';

describe('LinkSanitizer', () => {
  it('identifies and allows internal workbook links', () => {
    const res = linkSanitizer.checkLink('#Sheet2!A1');
    expect(res.allowed).toBe(true);
    expect(res.isInternal).toBe(true);
    expect(res.reason).toBe('direct_internal');
  });

  it('allows safe external links with confirmation required', () => {
    const httpsRes = linkSanitizer.checkLink('https://example.com/data');
    expect(httpsRes.allowed).toBe(true);
    expect(httpsRes.isInternal).toBe(false);
    expect(httpsRes.reason).toBe('external_confirmation');

    const mailtoRes = linkSanitizer.checkLink('mailto:support@example.com');
    expect(mailtoRes.allowed).toBe(true);
    expect(mailtoRes.isInternal).toBe(false);
    expect(mailtoRes.reason).toBe('external_confirmation');
  });

  it('strictly blocks hazardous protocols', () => {
    const jsRes = linkSanitizer.checkLink('javascript:alert(1)');
    expect(jsRes.allowed).toBe(false);
    expect(jsRes.reason).toBe('blocked_scheme');

    const fileRes = linkSanitizer.checkLink('file:///etc/passwd');
    expect(fileRes.allowed).toBe(false);
    expect(fileRes.reason).toBe('blocked_scheme');

    const dataRes = linkSanitizer.checkLink('data:text/html,<script>alert(1)</script>');
    expect(dataRes.allowed).toBe(false);
    expect(dataRes.reason).toBe('blocked_scheme');

    const customRes = linkSanitizer.checkLink('calc:payload');
    expect(customRes.allowed).toBe(false);
    expect(customRes.reason).toBe('blocked_scheme');
  });
});
