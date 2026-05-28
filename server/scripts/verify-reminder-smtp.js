require('dotenv').config();

const { getReminderConfig } = require('../config/reminders');
const {
  buildReminderMessage,
  createTransport,
} = require('../services/emailService');
const nodemailer = require('nodemailer');

async function main() {
  const config = getReminderConfig();
  if (!config.enabled) {
    console.error('Reminders disabled. Set REMINDER_EMAIL and SMTP_* in server/.env');
    process.exit(1);
  }

  console.log('Sending test reminder to', config.to);

  const todo = {
    title: 'SMTP configuration test',
    description: 'If you see this, reminder email is working.',
    dueDate: '2026-06-01T12:00:00',
  };
  const { subject, text } = buildReminderMessage(todo);
  const transporter = createTransport(config.smtp);
  const info = await transporter.sendMail({
    from: config.from,
    to: config.to,
    subject,
    text,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    console.log('Preview URL:', preview);
  }
  console.log('OK — reminder SMTP configured');
}

main().catch((err) => {
  console.error('SMTP test failed:', err.message);
  process.exit(1);
});
