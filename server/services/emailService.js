const nodemailer = require('nodemailer');
const { getReminderConfig } = require('../config/reminders');

function buildReminderMessage(todo) {
  const subject = `Reminder: ${todo.title} due soon`;
  const lines = [
    `Todo: ${todo.title}`,
    todo.description ? `Description: ${todo.description}` : null,
    `Due: ${todo.dueDate}`,
  ].filter(Boolean);
  return { subject, text: lines.join('\n') };
}

function createTransport(smtp) {
  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.auth,
  });
}

async function sendReminderEmail({ to, from, todo }, transport) {
  const { subject, text } = buildReminderMessage(todo);
  const transporter = transport ?? createTransport(getReminderConfig().smtp);
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
  });
}

module.exports = {
  buildReminderMessage,
  createTransport,
  sendReminderEmail,
};
