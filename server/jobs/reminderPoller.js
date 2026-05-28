const todosRepository = require('../repositories/todosRepository');
const { isReminderDue } = require('../utils/reminderDue');
const { sendReminderEmail } = require('../services/emailService');
const { getReminderConfig } = require('../config/reminders');

async function runReminderPollOnce(config, deps = {}) {
  if (!config?.enabled) {
    return;
  }

  const now = deps.now ?? new Date();
  const repo = deps.repo ?? todosRepository;
  const send = deps.sendReminderEmail ?? sendReminderEmail;
  const leadMinutes = config.leadMinutes;

  const candidates = await repo.findTodosPendingReminder();

  for (const todo of candidates) {
    if (!isReminderDue(todo.dueDate, leadMinutes, now)) {
      continue;
    }
    try {
      await send({
        to: config.to,
        from: config.from,
        todo,
      });
      await repo.markReminderSent(todo.id);
    } catch (err) {
      console.error(
        `Reminder email failed for todo ${todo.id}:`,
        err.message
      );
    }
  }
}

let pollTimer = null;

function startReminderScheduler(config = getReminderConfig()) {
  if (!config.enabled) {
    console.warn(
      'Email reminders disabled: set REMINDER_EMAIL and SMTP_* in .env'
    );
    return () => {};
  }

  console.log(
    `Email reminders enabled (lead ${config.leadMinutes}m, poll ${config.pollIntervalMs}ms)`
  );

  const tick = () => {
    runReminderPollOnce(config).catch((err) => {
      console.error('Reminder poll failed:', err.message);
    });
  };

  tick();
  pollTimer = setInterval(tick, config.pollIntervalMs);

  return () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  };
}

function stopReminderScheduler() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

module.exports = {
  runReminderPollOnce,
  startReminderScheduler,
  stopReminderScheduler,
};
