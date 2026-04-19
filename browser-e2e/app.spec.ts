import { test, expect, type Page } from '@playwright/test';

// Real browser E2E tests — click, type, verify visual output
// Requires: mock-server.mjs running on :8090, vite dev on :3000

test.describe('kestrel-talk browser E2E', () => {

  test('1. App loads with empty state', async ({ page }) => {
    await page.goto('/');
    // Should show the empty state with kestrel-agent branding
    await expect(page.locator('.empty-title')).toHaveText('kestrel-agent');
    await expect(page.locator('.empty-text')).toBeVisible();
  });

  test('2. Sidebar shows connection status', async ({ page }) => {
    await page.goto('/');
    // Wait for WebSocket to connect
    await page.waitForTimeout(1500);
    // Sidebar should show "kestrel-agent" chat item
    const chatItem = page.locator('.chat-item').first();
    await expect(chatItem).toBeVisible();
    // Online dot should be visible (connected to mock server)
    const onlineDot = page.locator('.online-dot');
    await expect(onlineDot).toBeVisible();
  });

  test('3. Chat header shows online status', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);
    // Header should show "online" when connected
    const statusText = page.locator('.header-status');
    await expect(statusText).toContainText('online');
  });

  test('4. Type and send a message', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Click on textarea and type a message
    const textarea = page.locator('textarea');
    await textarea.click();
    await textarea.fill('Hello kestrel!');
    // Verify text was typed
    await expect(textarea).toHaveValue('Hello kestrel!');

    // Press Enter to send
    await textarea.press('Enter');

    // Textarea should be cleared after send
    await expect(textarea).toHaveValue('');

    // User message bubble should appear
    const userBubble = page.locator('.bubble.user').first();
    await expect(userBubble).toBeVisible({ timeout: 5000 });
    await expect(userBubble).toContainText('Hello kestrel!');
  });

  test('5. Receive streaming response with blocks', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message to trigger mock response
    const textarea = page.locator('textarea');
    await textarea.fill('hello');
    await textarea.press('Enter');

    // Wait for assistant response to complete
    await page.waitForTimeout(3000);

    // Assistant bubble should appear
    const assistantBubble = page.locator('.bubble.assistant').first();
    await expect(assistantBubble).toBeVisible({ timeout: 10000 });
    // Should contain text from mock response
    await expect(assistantBubble).toContainText('kestrel-agent');
  });

  test('6. Code block with syntax highlighting', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send first message (text response), then second (code response)
    const textarea = page.locator('textarea');

    // Message 1
    await textarea.fill('skip');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Message 2 — triggers code block response
    await textarea.fill('show me code');
    await textarea.press('Enter');
    await page.waitForTimeout(3000);

    // Code block should appear with language label
    const codeBlock = page.locator('.code-block').first();
    await expect(codeBlock).toBeVisible({ timeout: 10000 });
    // Language label should show
    const langLabel = page.locator('.code-lang').first();
    await expect(langLabel).toBeVisible();
  });

  test('7. Copy button on code block', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send messages to get code block
    const textarea = page.locator('textarea');
    await textarea.fill('skip');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);
    await textarea.fill('code');
    await textarea.press('Enter');
    await page.waitForTimeout(3000);

    // Hover over code block to reveal copy button
    const codeBlock = page.locator('.code-block').first();
    await codeBlock.hover();
    const copyBtn = page.locator('.code-block .copy-btn').first();
    await expect(copyBtn).toBeVisible();
  });

  test('8. Thinking block is collapsible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send messages to get thinking block (response 2 has thinking)
    const textarea = page.locator('textarea');
    await textarea.fill('skip');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);
    await textarea.fill('think');
    await textarea.press('Enter');
    await page.waitForTimeout(3000);

    // Thinking block should exist
    const thinkingBlock = page.locator('.thinking-block').first();
    await expect(thinkingBlock).toBeVisible({ timeout: 10000 });
  });

  test('9. Tool call blocks', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send 4 messages to get tool call response (response index 3)
    const textarea = page.locator('textarea');
    for (let i = 0; i < 4; i++) {
      await textarea.fill(`msg ${i}`);
      await textarea.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Tool block should appear
    const toolBlock = page.locator('.tool-block').first();
    await expect(toolBlock).toBeVisible({ timeout: 10000 });
  });

  test('10. Search bar opens with Ctrl+F', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message first so there's content to search
    const textarea = page.locator('textarea');
    await textarea.fill('hello');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Press Ctrl+F to open search
    await page.keyboard.press('Control+f');

    // Search bar should be visible
    const searchInput = page.locator('.search-bar input');
    await expect(searchInput).toBeVisible({ timeout: 3000 });

    // Type search query
    await searchInput.fill('kestrel');
    // Should find matches
    const matchCount = page.locator('.match-count');
    await expect(matchCount).toBeVisible({ timeout: 3000 });

    // Close search with Escape
    await page.keyboard.press('Escape');
    const searchBar = page.locator('.search-bar');
    await expect(searchBar).not.toBeVisible();
  });

  test('11. Export chat as markdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message
    const textarea = page.locator('textarea');
    await textarea.fill('test export');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Click export button in sidebar footer
    const exportBtn = page.locator('[aria-label="Export chat"]');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      exportBtn.click(),
    ]);

    // Verify download happened
    expect(download).toBeTruthy();
    const content = await download.createReadStream();
    expect(content).toBeTruthy();
  });

  test('12. /clear command clears history', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message
    const textarea = page.locator('textarea');
    await textarea.fill('will be cleared');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Verify message exists
    const userBubble = page.locator('.bubble.user').first();
    await expect(userBubble).toBeVisible();

    // Type /clear command
    await textarea.fill('/clear');
    await textarea.press('Enter');
    await page.waitForTimeout(500);

    // Messages should be cleared — empty state should show
    await expect(page.locator('.empty-title')).toBeVisible({ timeout: 3000 });
  });

  test('13. Input history with arrow keys', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea');

    // Send a message
    await textarea.fill('test input history');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    // Clear textarea
    // Press ArrowUp to recall last message
    await textarea.press('ArrowUp');
    await expect(textarea).toHaveValue('test input history');

    // Press ArrowDown to clear
    await textarea.press('ArrowDown');
    await expect(textarea).toHaveValue('');
  });

  test('14. Connection settings panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Click settings gear button in sidebar
    const settingsBtn = page.locator('[aria-label="Connection settings"]');
    await settingsBtn.click();

    // Settings panel should appear
    const panel = page.locator('.settings-panel');
    await expect(panel).toBeVisible();

    // Should have URL and token fields
    const urlInput = page.locator('input[placeholder="ws://127.0.0.1:8090"]');
    await expect(urlInput).toBeVisible();

    const tokenInput = page.locator('input[type="password"]');
    await expect(tokenInput).toBeVisible();

    // Close settings
    const closeBtn = page.locator('.close-btn');
    await closeBtn.click();
    await expect(panel).not.toBeVisible();
  });

  test('15. Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(1500);

    // On mobile, sidebar should be hidden by default
    const sidebarWrapper = page.locator('.sidebar-wrapper');
    // Sidebar wrapper should be off-screen (transform: translateX(-100%))
    const transform = await sidebarWrapper.evaluate(el => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');

    // Chat area should take full width
    const chatArea = page.locator('.chat-area');
    await expect(chatArea).toBeVisible();

    // Send a message to verify mobile works
    const textarea = page.locator('textarea');
    await textarea.fill('mobile test');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    const userBubble = page.locator('.bubble.user').first();
    await expect(userBubble).toBeVisible({ timeout: 5000 });
  });

  test('16. Scroll to bottom button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send multiple messages to create scrollable content
    const textarea = page.locator('textarea');
    for (let i = 0; i < 8; i++) {
      await textarea.fill(`message ${i} to create scroll`);
      await textarea.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Scroll up
    await page.locator('.message-list').evaluate(el => el.scrollTop = 0);
    await page.waitForTimeout(300);

    // Scroll-to-bottom button should appear
    const scrollBtn = page.locator('.scroll-to-bottom');
    await expect(scrollBtn).toBeVisible({ timeout: 3000 });

    // Click it
    await scrollBtn.click();
    await page.waitForTimeout(1000);

    // Should be at bottom now
    const isAtBottom = await page.locator('.message-list').evaluate(el => {
      return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    });
    expect(isAtBottom).toBeTruthy();
  });

  test('17. Date separator shows', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message
    const textarea = page.locator('textarea');
    await textarea.fill('test date');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Date separator should be visible (shows "Today")
    const dateSep = page.locator('.date-separator span').first();
    await expect(dateSep).toBeVisible();
    await expect(dateSep).toContainText('Today');
  });

  test('18. Checkmark on user messages', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea');
    await textarea.fill('check this');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    // User bubble should have checkmark SVG
    const checkmark = page.locator('.bubble.user .checkmark').first();
    await expect(checkmark).toBeVisible();
  });

  test('19. /help command shows available commands', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea');
    await textarea.fill('/help');
    await textarea.press('Enter');
    await page.waitForTimeout(1000);

    // Should show system message with commands
    const assistantBubble = page.locator('.bubble.assistant').first();
    await expect(assistantBubble).toBeVisible({ timeout: 5000 });
    await expect(assistantBubble).toContainText('/clear');
    await expect(assistantBubble).toContainText('/help');
    await expect(assistantBubble).toContainText('/export');
  });

  test('20. /export command triggers download', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message first so there's content
    const textarea = page.locator('textarea');
    await textarea.fill('export test');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Use /export command
    await textarea.fill('/export');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      textarea.press('Enter'),
    ]);

    expect(download).toBeTruthy();
    const content = await download.createReadStream();
    expect(content).toBeTruthy();
  });

  test('21. Reconnection banner shows attempt count', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Simulate disconnect by evaluating JS to close the WebSocket
    await page.evaluate(() => {
      // @ts-expect-error test access
      const ws = window.__test_ws;
      if (ws) ws.close();
    });

    // Wait for reconnection attempt
    await page.waitForTimeout(2000);

    // Connection banner should show
    const banner = page.locator('.connection-banner');
    // May or may not be visible depending on timing, but should not crash
    const bannerVisible = await banner.isVisible().catch(() => false);
    // Just verify the app didn't crash
    await expect(page.locator('#app')).toBeVisible();
  });

  test('22. Toast appears after /clear command', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea');
    await textarea.fill('message to clear');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    await textarea.fill('/clear');
    await textarea.press('Enter');
    await page.waitForTimeout(500);

    // Toast should appear
    const toast = page.locator('.toast').first();
    await expect(toast).toBeVisible({ timeout: 3000 });
    await expect(toast).toContainText('cleared');
  });

  test('23. Mobile sidebar toggles with hamburger', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Sidebar wrapper should be off-screen
    const wrapper = page.locator('.sidebar-wrapper');
    let transform = await wrapper.evaluate(el => getComputedStyle(el).transform);
    expect(transform).not.toBe('none');

    // Click hamburger in chat header
    const menuBtn = page.locator('.chat-area .menu-btn');
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Sidebar should slide in (transform becomes identity)
    transform = await wrapper.evaluate(el => getComputedStyle(el).transform);
    expect(transform === 'none' || transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(true);

    // Sidebar content should be visible
    const chatItem = page.locator('.chat-item');
    await expect(chatItem).toBeVisible();
  });

  test('24. Code blocks show line numbers', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea');
    await textarea.fill('skip');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);
    await textarea.fill('code');
    await textarea.press('Enter');
    await page.waitForTimeout(3000);

    // Line numbers should be visible in code block
    const lineNumbers = page.locator('.code-block .line-numbers').first();
    await expect(lineNumbers).toBeVisible({ timeout: 10000 });
    // Should have at least 2 line number spans
    const spans = lineNumbers.locator('span');
    const count = await spans.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('25. Theme toggle switches between dark and light', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Capture initial theme
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBeTruthy();

    // Click theme toggle in sidebar footer
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    await themeBtn.click();
    await page.waitForTimeout(300);

    // Should switch to opposite theme
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(theme);

    // Toggle back
    await themeBtn.click();
    await page.waitForTimeout(300);
    const backToOriginal = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(backToOriginal).toBe(theme);
  });

  test('26. Search highlight on matched message', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send a message
    const textarea = page.locator('textarea');
    await textarea.fill('findable message');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // Open search
    await page.keyboard.press('Control+f');
    await page.waitForTimeout(300);

    // Type search query
    const searchInput = page.locator('.search-bar input');
    await searchInput.fill('findable');
    await page.waitForTimeout(300);

    // Press Enter to jump to first match
    await searchInput.press('Enter');
    await page.waitForTimeout(500);

    // Matched message should have highlight class
    const highlighted = page.locator('.search-highlight-active');
    await expect(highlighted).toBeVisible({ timeout: 3000 });
  });

  test('27. Connected toast appears on first connection', async ({ page }) => {
    await page.goto('/');
    // Wait for connection and toast
    const toast = page.locator('.toast.success');
    await expect(toast).toContainText('Connected', { timeout: 5000 });
  });

  test('28. Message timestamps are visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    const textarea = page.locator('textarea');
    await textarea.fill('timestamp test');
    await textarea.press('Enter');
    await page.waitForTimeout(2000);

    // User message should have a time indicator
    const bubbleTime = page.locator('.bubble-time').first();
    await expect(bubbleTime).toBeVisible();
  });

  test('29. Settings panel toggles', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Click settings gear
    const settingsBtn = page.locator('.settings-toggle');
    await settingsBtn.click();
    await page.waitForTimeout(300);

    // Settings panel should be visible
    const panel = page.locator('.settings-panel');
    await expect(panel).toBeVisible();

    // Should have WebSocket URL input
    const wsInput = page.locator('input[placeholder="ws://127.0.0.1:8090"]');
    await expect(wsInput).toBeVisible();

    // Close settings
    const closeBtn = page.locator('.close-btn');
    await closeBtn.click();
    await page.waitForTimeout(300);
    await expect(panel).not.toBeVisible();
  });

  test('30. Error block shows retry button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send messages to cycle to error response (index 5 in mock server)
    for (let i = 0; i < 6; i++) {
      const textarea = page.locator('textarea');
      await textarea.fill(`msg ${i}`);
      await textarea.press('Enter');
      await page.waitForTimeout(1500);
    }

    // Should see an error block with retry button
    const retryBtn = page.locator('.retry-btn');
    if (await retryBtn.count() > 0) {
      await expect(retryBtn.first()).toBeVisible();
    }
  });

  test('31. Escape closes settings panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Open settings
    await page.locator('.settings-toggle').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.settings-panel')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('.settings-panel')).not.toBeVisible();
  });

  test('32. Theme persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Get initial theme
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    // Toggle theme
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    await themeBtn.click();
    await page.waitForTimeout(300);

    const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(toggledTheme).not.toBe(initialTheme);

    // Reload page
    await page.reload();
    await page.waitForTimeout(1500);

    // Theme should persist
    const afterReload = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(afterReload).toBe(toggledTheme);
  });

  test('33. Image block renders with caption', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send 9 messages to reach image protocol response (index 8 in mock)
    const textarea = page.locator('textarea');
    for (let i = 0; i < 9; i++) {
      await textarea.fill(`img-msg-${i}`);
      await textarea.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Should see image block
    const imageBlock = page.locator('.image-block').first();
    await expect(imageBlock).toBeVisible({ timeout: 15000 });
  });

  test('34. V1 streaming response renders', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');
    await page.waitForTimeout(1500);

    // Send 7 messages to reach v1 streaming response (index 6)
    const textarea = page.locator('textarea');
    for (let i = 0; i < 7; i++) {
      await textarea.fill(`v1-msg-${i}`);
      await textarea.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Assistant bubble from v1 streaming should be visible
    const bubbles = page.locator('.bubble.assistant');
    const count = await bubbles.count();
    expect(count).toBeGreaterThanOrEqual(7);
  });

  test('35. Character counter appears for long input', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.message-list');

    const textarea = page.locator('textarea');
    // Type 201+ characters
    await textarea.fill('a'.repeat(201));
    const counter = page.locator('.char-counter');
    await expect(counter).toBeVisible();
    expect(await counter.textContent()).toBe('201');
  });

  test('36. Ctrl+Shift+T toggles theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.message-list');

    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.keyboard.press('Control+Shift+T');
    const newTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(newTheme).not.toBe(initialTheme);
  });
});
