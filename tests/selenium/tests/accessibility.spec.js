// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Accessibility Tests
 * Tests for common accessibility issues
 */

test.describe('Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all images should have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      expect(alt, `Image ${src} is missing alt text`).toBeTruthy();
    }
  });

  test('all form inputs should have labels', async ({ page }) => {
    await page.goto('/login.html');
    
    const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        const hasAriaLabel = !!ariaLabel;
        const hasPlaceholder = !!placeholder;
        
        expect(
          hasLabel || hasAriaLabel || hasPlaceholder,
          `Input #${id} has no label, aria-label, or placeholder`
        ).toBeTruthy();
      }
    }
  });

  test('page should have proper heading hierarchy', async ({ page }) => {
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const count = await headings.count();
    
    // There should be at least one heading
    expect(count).toBeGreaterThan(0);
    
    // There should be exactly one h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count, 'Page should have exactly one h1').toBe(1);
    
    // Collect heading levels in order
    const levels = [];
    for (let i = 0; i < count; i++) {
      const tag = await headings.nth(i).evaluate(el => el.tagName);
      levels.push(parseInt(tag[1]));
    }
    
    // Check that headings don't skip levels
    for (let i = 1; i < levels.length; i++) {
      const jump = levels[i] - levels[i - 1];
      expect(
        jump <= 1,
        `Heading hierarchy jumps from h${levels[i-1]} to h${levels[i]}`
      ).toBeTruthy();
    }
  });

  test('interactive elements should be keyboard accessible', async ({ page }) => {
    // Tab through the page and track what gets focus
    await page.keyboard.press('Tab');
    
    const focusedTags = [];
    for (let i = 0; i < 10; i++) {
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? el.tagName.toLowerCase() : 'none';
      });
      focusedTags.push(focused);
      await page.keyboard.press('Tab');
    }
    
    // We should be able to reach links, inputs, and buttons via Tab
    expect(focusedTags, 'Should be able to Tab to a link').toContain('a');
    expect(focusedTags, 'Should be able to Tab to an input').toContain('input');
  });

  test('buttons should have accessible names', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      expect(
        (text && text.trim().length > 0) || ariaLabel || title,
        `Button ${i} has no accessible name`
      ).toBeTruthy();
    }
  });

  test('color contrast - text should be readable', async ({ page }) => {
    // Check that main text elements have sufficient contrast
    // (basic check - not a full WCAG audit)
    const body = page.locator('body');
    const bgColor = await body.evaluate(el => getComputedStyle(el).backgroundColor);
    const textColor = await body.evaluate(el => getComputedStyle(el).color);
    
    // Both should be defined (not transparent/inherit only)
    expect(bgColor).toBeTruthy();
    expect(textColor).toBeTruthy();
    
    // Text and background should be different
    expect(textColor).not.toBe(bgColor);
  });

  test('links should be distinguishable', async ({ page }) => {
    const links = page.locator('a:visible');
    const count = await links.count();
    
    // Page should have navigable links
    expect(count).toBeGreaterThan(0);
    
    // Check first few links have href attributes
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = links.nth(i);
      const href = await link.getAttribute('href');
      expect(href, `Link ${i} has no href`).toBeTruthy();
    }
  });

});
