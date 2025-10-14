import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home page has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');

  
  const results = await new AxeBuilder({ page })
   
    .analyze();

 
  const seriousOrCritical = results.violations.filter(v =>
    ['serious', 'critical'].includes((v.impact || '').toLowerCase())
  );

 
  if (seriousOrCritical.length) {
    
    console.log(
      'A11y violations:',
      seriousOrCritical.map(v => ({
        id: v.id,
        impact: v.impact,
        help: v.help,
        nodes: v.nodes.length
      }))
    );
  }

  expect(seriousOrCritical.length).toBe(0);
});
