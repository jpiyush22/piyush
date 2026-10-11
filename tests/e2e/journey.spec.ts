import { expect, test, type Page } from '@playwright/test';

const go = async (page: Page, id: string) => {
  await page.goto(`/#${id}`);
  await expect(page.locator('.content')).toBeVisible();
};

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  (page as unknown as { _errors: string[] })._errors = errors;
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
});

test.afterEach(async ({ page }) => {
  expect((page as unknown as { _errors: string[] })._errors).toEqual([]);
});

test('every section renders and the sidebar search filters', async ({ page }) => {
  for (const id of ['overview', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9']) {
    await go(page, id);
    await expect(page.locator('.content h1').first()).toBeVisible();
  }
  await page.getByLabel('Search sections').fill('drift');
  await expect(page.locator('.nav-item:has-text("When it breaks")')).toBeVisible();
  await expect(page.locator('.nav-item:has-text("Read the funnel")')).toHaveCount(0);
});

test('Step 1 · funnel numbers are computed and correct', async ({ page }) => {
  await go(page, 's1');
  const kpis = page.locator('#s1-kpis');
  await expect(kpis).toContainText('536');
  await expect(kpis).toContainText('41.0%');
  await expect(kpis).toContainText('55.1%');
  await expect(kpis).toContainText('14.1 pp');
  await page.getByRole('button', { name: 'Table 1 · blended' }).click();
  await expect(page.locator('.funnel')).toContainText('44.2% of Onboarding');
  await expect(page.locator('.funnel')).not.toContainText('SSF has no Sales stage');
  await page.getByRole('button', { name: 'Table 2 · by motion' }).click();
  await expect(page.locator('.funnel')).toContainText('SSF has no Sales stage');
  // drop-off (SSF default): onboarding → adoption loses 439
  await expect(page.locator('text=Largest absolute loss for SSF: Onboarding → Adoption (439 accounts)')).toBeVisible();
  await expect(page.locator('text=✗ no')).toHaveCount(0);
  await expect(page.getByText('proposed experiment target', { exact: false })).toBeVisible();
});

test('Steps 2–3 · Account A events, missing execution evidence, engine run, hand-off to Signal Desk', async ({ page }) => {
  await go(page, 's2');
  await expect(page.getByTestId('evidence-split')).toContainText('Missing information');
  await page.getByLabel('Filter events').fill('workflow_edited');
  const rows = page.locator('#s2-explorer tbody tr');
  await expect(rows).toHaveCount(3);
  await rows.nth(2).click();
  await expect(page.locator('.tl-tooltip')).toContainText('Day 19');
  await expect(page.locator('#s2-explorer')).toContainText('Execution events in the extract: 0');

  // day 32: no candidate
  await page.getByLabel('Evaluation day').fill('32');
  await page.getByTestId('run-engine-a').click();
  await expect(page.getByTestId('risk-result')).toContainText('UNKNOWN');
  await expect(page.getByTestId('risk-result')).not.toContainText('EDIT_RECENCY_PROXY_LOW_CONFIDENCE');
  // day 33: low-confidence, human-review-only
  await page.getByLabel('Evaluation day').fill('33');
  await page.getByTestId('run-engine-a').click();
  const r = page.getByTestId('risk-result');
  await expect(r).toContainText('EDIT_RECENCY_PROXY_LOW_CONFIDENCE');
  await expect(r).toContainText('Confidence LOW');
  await expect(r).toContainText('Human review only');
  await expect(r).toContainText('Review-eligible for customer action: no');
  await page.getByRole('button', { name: 'Send to Signal Desk · Data quality' }).click();
  await expect(page.getByRole('button', { name: '✓ In Signal Desk · Data quality' })).toBeDisabled();

  // narrative-only accounts don't get invented events
  await page.getByRole('button', { name: 'Account B' }).click();
  await expect(page.locator('#s2-explorer')).toContainText('No raw events for Account B');

  await go(page, 's7');
  await page.getByRole('tab', { name: /Data quality/ }).click();
  await expect(page.getByTestId('dq-case').first()).toContainText('ACCOUNT-A');
});

test('Section 4 · engine playground and architecture controls respond', async ({ page }) => {
  await go(page, 's4');
  await page.getByTestId('run-engine').click();
  await expect(page.getByTestId('risk-result')).toContainText('AT RISK');
  await expect(page.getByTestId('risk-result')).toContainText('NO_VERIFIED_RUN_14D');
  await page.getByLabel('Workspace snapshot').selectOption('WS-1201');
  await page.getByTestId('run-engine').click();
  await expect(page.getByTestId('risk-result')).toContainText('UNKNOWN');
  await page.getByLabel('Workspace snapshot').selectOption('WS-0974');
  await page.getByTestId('run-engine').click();
  await expect(page.getByTestId('risk-result')).toContainText('RECOVERED');
  // dry-run checks for an eligible desk workspace without a review → reviewer check fails, nothing sent
  await page.getByLabel('Workspace snapshot').selectOption('WS-0881');
  await page.getByTestId('run-engine').click();
  await page.getByRole('button', { name: 'Dry-run pre-action checks' }).click();
  await expect(page.getByTestId('dry-run-checks')).toContainText('Reviewer confirmed the risk');
  await expect(page.getByTestId('dry-run-checks')).toContainText('1 blocking');
  // architecture: node details + timing filter
  await page.getByRole('button', { name: 'Dagster: show details' }).click();
  await expect(page.locator('.card').filter({ hasText: 'Why it lives here' }).first()).toContainText('Dagster');
  await page.getByRole('button', { name: 'Scheduled · daily' }).click();
  await expect(page.getByRole('button', { name: 'Scheduled · daily' })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('svg animateMotion').first()).toBeAttached();
});

test('Steps 4–5 · review, guarded action, duplicates, eligibility and uncertain delivery', async ({ page }) => {
  await go(page, 's7');
  const desk = page.locator('#signal-desk');
  // queue separation
  await expect(desk.locator('[data-testid^="row-"]')).toHaveCount(5);
  await expect(desk.getByTestId('row-WS-1201')).toHaveCount(0);
  await expect(desk.getByTestId('row-WS-0974')).toHaveCount(0);

  // validation: false positive needs a reason
  await desk.getByTestId('row-WS-1042').click();
  await desk.getByRole('button', { name: 'False positive' }).click();
  await desk.getByTestId('save-review').click();
  await expect(desk.locator('.err')).toContainText('A reason is required');
  // snooze needs reason + expiry
  await desk.getByRole('button', { name: 'Snooze' }).click();
  await desk.getByTestId('save-review').click();
  await expect(desk.locator('.err')).toHaveCount(2);

  // eligible Sales-led case
  await desk.getByTestId('row-WS-0881').click();
  await desk.getByRole('button', { name: 'Confirm risk' }).click();
  await desk.getByTestId('save-review').click();
  await expect(desk.getByRole('status').first()).toContainText('computed WATCH preserved');
  await expect(desk.getByTestId('checks')).not.toContainText('✗');
  await desk.getByTestId('dispatch').click();
  await expect(desk.getByTestId('last-outcome')).toContainText('dispatched');
  await desk.getByTestId('dispatch').click();
  await expect(desk.getByTestId('last-outcome')).toContainText('duplicate');
  await desk.getByRole('button', { name: 'Simulate 3 concurrent requests' }).click();
  await expect(desk.getByTestId('last-outcome')).toContainText('duplicate · duplicate · duplicate');

  // cancelled on the live check
  await desk.getByTestId('row-WS-1188').click();
  await desk.getByRole('button', { name: 'Confirm risk' }).click();
  await desk.getByTestId('save-review').click();
  await expect(desk.getByTestId('checks')).toContainText('Live status: cancelled');
  await desk.getByTestId('dispatch').click();
  await expect(desk.getByTestId('last-outcome')).toContainText('suppressed');

  // opted out
  await desk.getByTestId('row-WS-1135').click();
  await desk.getByRole('button', { name: 'Confirm risk' }).click();
  await desk.getByTestId('save-review').click();
  await desk.getByTestId('dispatch').click();
  await expect(desk.getByTestId('last-outcome')).toContainText('suppressed');

  // uncertain delivery → pending → reconcile, not resend
  await desk.getByTestId('row-WS-1042').click();
  await desk.getByRole('button', { name: 'Confirm risk' }).click();
  await desk.getByTestId('save-review').click();
  await desk.getByLabel('Next simulated delivery outcome').selectOption('timeout');
  await desk.getByTestId('dispatch').click();
  await expect(desk.getByTestId('last-outcome')).toContainText('uncertain');
  await desk.getByTestId('dispatch').click();
  await expect(desk.getByTestId('last-outcome')).toContainText('duplicate');

  await desk.getByRole('tab', { name: /Action ledger/ }).click();
  await expect(desk).toContainText('Simulated outbox: 2 delivery(ies)');
  await desk.getByRole('button', { name: 'Reconcile', exact: true }).click();
  await desk.getByRole('button', { name: 'reconciled', exact: true }).click();
  await expect(desk.getByTestId('ledger-row')).toHaveCount(1);
  await expect(desk.getByTestId('ledger-row')).toContainText('Found at destination');
  await desk.getByRole('button', { name: 'dispatched', exact: true }).click();
  await expect(desk.getByTestId('ledger-row')).toHaveCount(1);
  await expect(desk.getByTestId('ledger-row')).toContainText('WS-0881');

  await desk.getByRole('tab', { name: /Decisions/ }).click();
  await expect(desk.locator('tbody tr')).toHaveCount(4);
});

test('Steps 6–7 · incident: detect, contain (desk banner), analyse, replay without outreach, restore', async ({ page }) => {
  await go(page, 's6');
  await page.getByLabel('Simulation day').fill('10');
  const next = page.getByTestId('incident-next');
  await expect(next).toContainText('Raise incident (detected day 2)');
  await next.click();
  await expect(next).toContainText('Contain');
  await next.click();

  await go(page, 's7');
  await expect(page.locator('.desk-banner')).toContainText('Semantic-integrity incident (contained)');
  await expect(page.locator('#signal-desk [data-testid^="row-"]')).toHaveCount(5); // execution-based flags unchanged

  await go(page, 's6');
  await page.getByTestId('incident-next').click(); // analyse
  await expect(page.locator('text=/Impact through day 2: \\d+ workspaces/')).toBeVisible();
  await page.getByTestId('incident-next').click(); // replay
  await expect(page.locator('.phases')).toContainText(/outbox (\d+) → \1\./);
  await page.getByTestId('incident-next').click(); // restore
  await expect(page.locator('.callout.ok', { hasText: 'Restored.' })).toContainText('Hold released.');

  await go(page, 's7');
  await expect(page.locator('.desk-banner')).toHaveCount(0);
  await page.getByRole('tab', { name: /Data quality/ }).click();
  await expect(page.getByTestId('dq-case').first()).toContainText('Incident repair');
  await page.getByRole('tab', { name: /Action ledger/ }).click();
  await page.getByRole('button', { name: 'suppressed', exact: true }).click();
  await expect(page.getByTestId('ledger-row').first()).toContainText('Outbound disabled');
  await expect(page.locator('#signal-desk')).toContainText('Simulated outbox: 0 delivery(ies)');
});

test('Step 8 · outcomes gates respond to real actions', async ({ page }) => {
  await go(page, 's7');
  await page.getByRole('tab', { name: 'Outcomes' }).click();
  const out = page.getByTestId('outcomes');
  await expect(out).toContainText('0/5 reviewed');
  await expect(out.locator('.stat').filter({ hasText: 'Closed loop' })).toContainText('not met');
  await out.getByLabel('Improvement').fill('Exclude system-originated workflow_edited from the edit proxy');
  await out.getByRole('button', { name: 'Log improvement' }).click();
  await expect(out.locator('.stat').filter({ hasText: 'Closed loop' })).toContainText('met');
  await expect(out.locator('.stat').filter({ hasText: 'Safety' })).toContainText('0 inappropriate sends');
  await expect(out.locator('.stat').filter({ hasText: 'Time saved' })).toContainText('not measurable');
});

test('Section 5 · CRM explorer: approvals need evidence, roll-up, apply, rollback, domain grouping refused', async ({ page }) => {
  await go(page, 's5');
  await page.getByRole('button', { name: 'Try: group Workspaces by email domain' }).click();
  await expect(page.locator('text=Blocked.')).toBeVisible();
  await page.getByRole('button', { name: 'Proposed model' }).click();
  const row = page.locator('tr', { hasText: 'Beauty Lounge GmbH → Beauty Lounge GmbH (legal entity)' }).filter({ has: page.getByRole('button', { name: 'Approve' }) });
  await row.getByRole('button', { name: 'Approve' }).click();
  await expect(row.getByRole('status')).toContainText('named reviewer');
  await row.getByPlaceholder('Reviewer (name, team)').fill('Jonas (AE)');
  await row.getByPlaceholder('Verification source / reason').fill('Signed order form');
  await row.getByRole('button', { name: 'Approve' }).click();
  await expect(page.getByTestId('seat-rollup')).toContainText('25 seats across 1 verified workspace');
  await page.getByRole('button', { name: 'Apply 1 verified to pilot' }).click();
  await page.getByRole('button', { name: 'Roll back pilot batch (1)' }).click();
  await expect(page.locator('text=Restored from change log')).toBeVisible();
  await expect(page.getByTestId('seat-rollup')).toContainText('No verified operating-Company links');
});

test('persistence and reset', async ({ page }) => {
  await go(page, 's7');
  const desk = page.locator('#signal-desk');
  await desk.getByTestId('row-WS-0881').click();
  await desk.getByRole('button', { name: 'Confirm risk' }).click();
  await desk.getByTestId('save-review').click();
  await page.reload();
  await expect(desk.getByRole('tab', { name: 'Decisions (1)' })).toBeVisible();
  page.once('dialog', (d) => d.accept());
  await desk.getByRole('button', { name: 'Reset demo state' }).click();
  await expect(desk.getByRole('tab', { name: 'Decisions (0)' })).toBeVisible();
});

test('guided demo walks all nine steps across sections', async ({ page }) => {
  await go(page, 'overview');
  await page.getByTestId('guided-demo').click();
  const wt = page.getByTestId('walkthrough');
  await expect(wt).toContainText('1/9');
  await expect(page).toHaveURL(/#s1$/);
  for (let i = 2; i <= 9; i++) {
    await wt.getByTestId('wt-next').or(wt.getByRole('button', { name: 'Finish' })).first().click();
    await expect(wt).toContainText(`${i}/9`);
  }
  await expect(page).toHaveURL(/#s8$/);
  await wt.getByRole('button', { name: 'Finish' }).click();
  await expect(wt).toHaveCount(0);
});

test('Section 8 embeds both walkthrough videos', async ({ page }) => {
  await page.goto('/#s8');
  const frames = page.getByTestId('videos').locator('iframe');
  await expect(frames).toHaveCount(2);
  await expect(frames.nth(0)).toHaveAttribute('src', 'https://www.loom.com/embed/bc819e8c31154fef80e374f939e7663f');
  await expect(frames.nth(1)).toHaveAttribute('src', 'https://www.loom.com/embed/aa400fbaa83c4db986b0ca700fecb8ab');
});
