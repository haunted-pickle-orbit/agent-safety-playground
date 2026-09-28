import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';


test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(response.url() + ' ' + response.status()); });
  page.__errors = errors;
});
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([]);
});
const cases = [
  ['网页里的隐藏指令', '限制收件人'],
  ['文件助手权限过大', '限制任务目录'],
  ['插件描述诱导行为', '限制可调用工具'],
];
for (const [name, control] of cases) test(name + ': baseline → safeguard → state → export', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Agent Safety Playground/);
  await expect(page.locator('vite-error-overlay')).toHaveCount(0);
  await page.getByRole('button', { name: new RegExp(name) }).click();
  await page.getByRole('button', { name: '运行对比', exact: true }).click();
  await expect(page.getByText('越权动作已执行', { exact: true })).toHaveCount(2);
  await page.getByLabel(control, { exact: false }).check();
  await expect(page.getByRole('button', { name: '导出记录' })).toBeDisabled();
  await page.getByRole('button', { name: '运行对比', exact: true }).click();
  await expect(page.getByText('危险动作已拦截', { exact: true })).toHaveCount(1);
  await expect(page.getByText('✓ 正常任务完成', { exact: true })).toHaveCount(2);
  await page.getByText('查看状态变化', { exact: true }).last().click();
  await expect(page.getByText('新增权限', { exact: true }).last()).toBeVisible();
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出记录' }).click();
  const report = JSON.parse(await readFile(await (await waiting).path(), 'utf8'));
  expect(report.current.passed).toBe(true);
  expect(report.schemaVersion).toBe(1);
});
test('switching courses retains work, progress and language survive refresh, reset clears only one lab', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('限制收件人', { exact: false }).check();
  await page.getByRole('button', { name: '运行对比' }).click();
  await page.getByRole('button', { name: '下一关' }).click();
  await page.getByRole('button', { name: /网页里的隐藏指令/ }).click();
  await expect(page.getByLabel('限制收件人', { exact: false })).toBeChecked();
  await expect(page.getByText('危险动作已拦截', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Previously passed', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Reset lab' }).click();
  await expect(page.getByLabel('Previously passed', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Export trace' })).toBeDisabled();
});
test('toggle on and off restores an equivalent report; keyboard controls work', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '运行对比' }).click();
  const checkbox = page.getByLabel('限制收件人', { exact: false });
  await checkbox.focus();
  await page.keyboard.press('Space');
  await expect(checkbox).toBeChecked();
  await expect(page.getByRole('button', { name: '导出记录' })).toBeDisabled();
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: '导出记录' })).toBeEnabled();
});
test('unavailable storage and corrupted progress do not break the app', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('unavailable'); } }));
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('浏览器未允许本地保存');
  await page.getByRole('button', { name: '运行对比' }).click();
  await expect(page.getByText('越权动作已执行', { exact: true })).toHaveCount(2);
});
test('malformed progress can be recovered', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('agent-safety-playground:v1', '{broken'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '网页里的隐藏指令', exact: true })).toBeVisible();
});
for (const width of [320, 390, 768]) test('responsive workflow at ' + width + 'px', async ({ page }) => {
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.getByRole('button', { name: /Misleading tool descriptions/ }).click();
  await page.getByLabel('Restrict available tools', { exact: false }).check();
  await page.getByRole('button', { name: 'Run comparison' }).click();
  await expect(page.getByText('Unsafe action blocked', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Export trace' })).toBeVisible();
});
for (const id of ['web', 'files', 'tools']) test('offline ' + id + ': downloaded HTML, language, export and reset without a server', async ({ page }, testInfo) => {
  await page.goto('/');
  const index = ['web', 'files', 'tools'].indexOf(id);
  await page.locator('nav button').nth(index).click();
  const waiting = page.waitForEvent('download');
  await page.getByRole('link', { name: '下载关卡' }).click();
  const downloaded = await waiting;
  const file = testInfo.outputPath(id + '.html'); await downloaded.saveAs(file);
  await page.goto(pathToFileURL(file).href);
  await expect(page.locator('#title')).not.toBeEmpty();
  await page.locator('input').first().check();
  await page.locator('#run').click();
  await expect(page.locator('#status')).toContainText('验证通过');
  await page.locator('#language').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#status')).toContainText('Verified');
  const resultDownload = page.waitForEvent('download');
  await page.locator('#export').click();
  const result = JSON.parse(await readFile(await (await resultDownload).path(), 'utf8'));
  expect(result.current.passed).toBe(true);
  await page.locator('input').first().uncheck();
  await expect(page.locator('#export')).toBeDisabled();
  await page.locator('#reset').click();
  await expect(page.locator('#results article')).toHaveCount(0);
});
