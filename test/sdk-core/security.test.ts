/**
 * Tests for security utilities
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHtml, validateSelector } from '../../packages/sdk-core/src/security.js';

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', async () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = await sanitizeHtml(html);
    expect(result).toContain('<p>');
    expect(result).toContain('<strong>');
  });

  it('should remove script tags', async () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = await sanitizeHtml(html);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('should remove event handlers', async () => {
    const html = '<p onclick="alert(\'xss\')">Click me</p>';
    const result = await sanitizeHtml(html);
    expect(result).not.toContain('onclick');
  });

  it('should remove dangerous tags', async () => {
    const html = '<iframe src="evil.com"></iframe>';
    const result = await sanitizeHtml(html);
    expect(result).not.toContain('<iframe');
  });

  it('should allow links with safe attributes', async () => {
    const html = '<a href="https://example.com" target="_blank">Link</a>';
    const result = await sanitizeHtml(html);
    expect(result).toContain('<a');
    expect(result).toContain('href');
  });
});

describe('validateSelector', () => {
  it('should allow safe CSS selectors', () => {
    expect(validateSelector('#my-id')).toBe(true);
    expect(validateSelector('.my-class')).toBe(true);
    expect(validateSelector('[data-test]')).toBe(true);
    expect(validateSelector('button.primary')).toBe(true);
  });

  it('should reject selectors with script', () => {
    expect(validateSelector('script')).toBe(false);
    expect(validateSelector('#my-script')).toBe(false);
  });

  it('should reject selectors with javascript:', () => {
    expect(validateSelector('[href="javascript:alert()"]')).toBe(false);
  });

  it('should reject null or undefined', () => {
    expect(validateSelector('')).toBe(false);
    expect(validateSelector(null as unknown as string)).toBe(false);
  });
});
