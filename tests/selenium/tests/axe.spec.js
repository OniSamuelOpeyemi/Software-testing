const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('homepage should have no critical accessibility violations', async ({ page }) => {
  await page.goto('/');
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])  // Test against WCAG 2.0 AA
    .analyze();
  
  expect(results.violations.filter(v => v.impact === 'critical')).toHaveLength(0);
});