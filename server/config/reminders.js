require('dotenv').config();

function parsePositiveInt(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    return null;
  }
  return n;
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === '') {
    return fallback;
  }
  return value === 'true' || value === '1';
}

function getReminderConfig() {
  const to = process.env.REMINDER_EMAIL?.trim();
  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM?.trim();
  const smtpPort = parsePositiveInt(process.env.SMTP_PORT, 587);
  const leadMinutes = parsePositiveInt(process.env.REMINDER_LEAD_MINUTES, 60);
  const pollIntervalMs = parsePositiveInt(process.env.REMINDER_POLL_INTERVAL_MS, 60000);

  const hasCore =
    Boolean(to) &&
    Boolean(smtpHost) &&
    Boolean(smtpUser) &&
    smtpPass !== undefined &&
    smtpPass !== '' &&
    Boolean(smtpFrom) &&
    leadMinutes !== null &&
    pollIntervalMs !== null &&
    smtpPort !== null;

  if (!hasCore) {
    return { enabled: false };
  }

  return {
    enabled: true,
    to,
    leadMinutes,
    pollIntervalMs,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      secure: parseBoolean(process.env.SMTP_SECURE, false),
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    },
    from: smtpFrom,
  };
}

function isRemindersEnabled() {
  return getReminderConfig().enabled;
}

module.exports = {
  getReminderConfig,
  isRemindersEnabled,
};
