/**
 * E2E Tests for Chat Application
 * RED PHASE: These tests should FAIL initially
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Application E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat page
    await page.goto('/chat');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display chat interface elements', async ({ page }) => {
    // Assert that main chat components are visible
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-list"]')).toBeVisible();
  });

  test('should send and receive a basic message', async ({ page }) => {
    // Arrange
    const testMessage = 'Hello, how are you?';

    // Act - Type and send message
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-button"]');

    // Assert - Message should appear in chat
    await expect(page.locator('[data-testid="message-user"]').last()).toContainText(testMessage);

    // Wait for AI response
    await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });

    // Assert - AI response should be meaningful
    const aiResponse = page.locator('[data-testid="message-assistant"]').last();
    await expect(aiResponse).toContainText(/[A-Za-z]/); // Should contain some text
  });

  test('should display agent status indicators', async ({ page }) => {
    // Arrange
    const testMessage = 'What is the weather like today?';

    // Act
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-button"]');

    // Assert - Should show routing status
    await expect(page.locator('[data-testid="agent-status"]')).toBeVisible();
    await expect(page.locator('[data-testid="agent-status"]')).toContainText(/thinking|analyzing/i);

    // Assert - Should show tool execution status for weather query
    await expect(page.locator('[data-testid="agent-status"]')).toContainText(/tool|weather/i, { timeout: 10000 });
  });

  test('should stream AI response in real-time', async ({ page }) => {
    // Arrange
    const testMessage = 'Tell me a short story';

    // Act
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-button"]');

    // Assert - Should show streaming indicator
    await expect(page.locator('[data-testid="streaming-indicator"]')).toBeVisible({ timeout: 5000 });

    // Assert - Response should appear incrementally
    const aiMessageElement = page.locator('[data-testid="message-assistant"]').last();
    await expect(aiMessageElement).toBeVisible({ timeout: 30000 });

    // Verify that content appears over time (streaming effect)
    const initialContent = await aiMessageElement.textContent();
    await page.waitForTimeout(1000);
    const laterContent = await aiMessageElement.textContent();

    // Content should grow as streaming progresses
    expect(laterContent?.length).toBeGreaterThan(initialContent?.length || 0);
  });

  test('should maintain conversation history', async ({ page }) => {
    // Arrange & Act - Send multiple messages
    const messages = [
      'What is your name?',
      'Can you help me with TypeScript?',
      'Thank you for your help!',
    ];

    for (const message of messages) {
      await page.fill('[data-testid="message-input"]', message);
      await page.click('[data-testid="send-button"]');

      // Wait for AI response before continuing
      await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });
      await page.waitForTimeout(1000); // Brief pause between messages
    }

    // Assert - All messages should be visible in chat history
    for (const message of messages) {
      await expect(page.locator('[data-testid="message-list"]')).toContainText(message);
    }

    // Assert - Should have equal number of user and assistant messages
    const userMessages = await page.locator('[data-testid="message-user"]').count();
    const assistantMessages = await page.locator('[data-testid="message-assistant"]').count();
    expect(userMessages).toBe(messages.length);
    expect(assistantMessages).toBe(messages.length);
  });

  test('should handle empty message submission gracefully', async ({ page }) => {
    // Act - Try to send empty message
    await page.click('[data-testid="send-button"]');

    // Assert - Should not submit empty message
    await expect(page.locator('[data-testid="message-user"]')).toHaveCount(0);

    // Assert - Send button should be disabled with empty input
    await expect(page.locator('[data-testid="send-button"]')).toBeDisabled();
  });

  test('should show loading state while processing', async ({ page }) => {
    // Arrange
    const testMessage = 'Explain quantum computing in simple terms';

    // Act
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-button"]');

    // Assert - Should show loading state
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="send-button"]')).toBeDisabled();

    // Wait for response to complete
    await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });

    // Assert - Loading state should be removed
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).not.toBeDisabled();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Arrange
    const testMessage = 'Hello from keyboard shortcut';

    // Act - Type message and use Enter to send
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.press('[data-testid="message-input"]', 'Enter');

    // Assert - Message should be sent
    await expect(page.locator('[data-testid="message-user"]').last()).toContainText(testMessage);
    await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });
  });

  test('should handle Shift+Enter for new lines', async ({ page }) => {
    // Arrange
    const multiLineMessage = 'Line 1\nLine 2\nLine 3';

    // Act - Type multi-line message using Shift+Enter
    await page.fill('[data-testid="message-input"]', 'Line 1');
    await page.press('[data-testid="message-input"]', 'Shift+Enter');
    await page.type('[data-testid="message-input"]', 'Line 2');
    await page.press('[data-testid="message-input"]', 'Shift+Enter');
    await page.type('[data-testid="message-input"]', 'Line 3');
    await page.press('[data-testid="message-input"]', 'Enter');

    // Assert - Multi-line message should be sent
    await expect(page.locator('[data-testid="message-user"]').last()).toContainText(multiLineMessage);
    await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });
  });

  test('should clear input after sending message', async ({ page }) => {
    // Arrange
    const testMessage = 'This message should be cleared after sending';

    // Act
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.click('[data-testid="send-button"]');

    // Assert - Input should be cleared after sending
    await expect(page.locator('[data-testid="message-input"]')).toHaveValue('');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Arrange - Mock network failure
    await page.route('**/api/chat', route => route.abort());

    // Act
    await page.fill('[data-testid="message-input"]', 'This should fail');
    await page.click('[data-testid="send-button"]');

    // Assert - Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/error|failed/i);

    // Assert - Should recover and allow retry
    await page.unroute('**/api/chat');
    await page.click('[data-testid="retry-button"]');

    // Should be able to send message again
    await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });
  });

  test('should maintain responsive design on mobile', async ({ page }) => {
    // Arrange - Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 6/7/8 size

    // Act - Navigate to chat
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    // Assert - Mobile interface should be functional
    await expect(page.locator('[data-testid="chat-container"]')).toBeVisible();
    await expect(page.locator('[data-testid="message-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="send-button"]')).toBeVisible();

    // Test mobile interaction
    const testMessage = 'Testing mobile responsiveness';
    await page.fill('[data-testid="message-input"]', testMessage);
    await page.tap('[data-testid="send-button"]');

    await expect(page.locator('[data-testid="message-user"]').last()).toContainText(testMessage);
    await expect(page.locator('[data-testid="message-assistant"]').last()).toBeVisible({ timeout: 30000 });
  });
});