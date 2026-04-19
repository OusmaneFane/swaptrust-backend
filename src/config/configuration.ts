export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  /** Liens dans les messages (WhatsApp, emails) */
  app: {
    url: process.env.APP_URL ?? process.env.FRONTEND_URL ?? 'https://swaptrust.com',
  },
  notifml: {
    apiKey: process.env.NOTIFML_API_KEY ?? '',
    baseUrl: process.env.NOTIFML_BASE_URL ?? 'https://api.notif.ml',
    sandbox: process.env.NOTIFML_SANDBOX === 'true',
  },
  databaseUrl: process.env.DATABASE_URL,
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  rates: {
    cacheTtlSeconds: parseInt(process.env.RATE_CACHE_TTL ?? '300', 10),
    cronInterval: process.env.RATE_CRON_INTERVAL ?? '*/5 * * * *',
    /** 1 XOF ≈ 0,14 RUB (ordre de grandeur si Google/DB indisponibles) */
    fallbackRate: parseFloat(process.env.RATE_FALLBACK ?? '0.143'),
    spreadPercent: parseFloat(process.env.RATE_SPREAD ?? process.env.EXCHANGE_SPREAD_PERCENT ?? '1'),
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },
  mail: {
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
    from: process.env.MAIL_FROM ?? 'noreply@swaptrust.com',
  },
  exchangeRate: {
    apiKey: process.env.EXCHANGE_RATE_API_KEY,
    apiUrl: process.env.EXCHANGE_RATE_API_URL ?? 'https://openexchangerates.org/api',
  },
  upload: {
    dest: process.env.UPLOAD_DEST ?? './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE ?? '5242880', 10),
  },
  commission: {
    platformPercent: parseFloat(
      process.env.COMMISSION_PERCENT ?? process.env.PLATFORM_COMMISSION_PERCENT ?? '0',
    ),
    spreadPercent: parseFloat(process.env.EXCHANGE_SPREAD_PERCENT ?? '1'),
  },
  swaptrust: {
    orangeMoney: process.env.SWAPTRUST_ORANGE_MONEY ?? '',
    wave: process.env.SWAPTRUST_WAVE ?? '',
    bankIban: process.env.SWAPTRUST_BANK_IBAN ?? '',
    bankName: process.env.SWAPTRUST_BANK_NAME ?? '',
    whatsappNumber: process.env.SWAPTRUST_WHATSAPP_NUMBER ?? '',
  },
  limits: {
    /** Montants en centimes CFA (ex. 500 000 = 5 000 F CFA) */
    minAmountXof: parseInt(process.env.MIN_AMOUNT_XOF ?? '500000', 10),
    maxAmountXof: parseInt(process.env.MAX_AMOUNT_XOF ?? '50000000', 10),
  },
});
