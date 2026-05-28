const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildReminderMessage,
  sendReminderEmail,
} = require('../services/emailService');

test('buildReminderMessage formats subject and body', () => {
  const { subject, text } = buildReminderMessage({
    title: 'Buy milk',
    description: '2%',
    dueDate: '2026-06-01T12:00:00',
  });
  assert.equal(subject, 'Reminder: Buy milk due soon');
  assert.match(text, /Buy milk/);
  assert.match(text, /2%/);
  assert.match(text, /2026-06-01T12:00:00/);
});

test('sendReminderEmail uses injected transport', async () => {
  const sent = [];
  const transport = {
    sendMail: async (options) => {
      sent.push(options);
      return { messageId: 'test-id' };
    },
  };

  await sendReminderEmail(
    {
      to: 'user@example.com',
      from: 'noreply@example.com',
      todo: {
        title: 'Task',
        description: '',
        dueDate: '2026-06-01T12:00:00',
      },
    },
    transport
  );

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'user@example.com');
  assert.equal(sent[0].from, 'noreply@example.com');
});
