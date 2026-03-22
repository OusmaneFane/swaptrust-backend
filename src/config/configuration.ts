export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
  databaseUrl: process.env.DATABASE_URL,
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
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
    platformPercent: parseFloat(process.env.PLATFORM_COMMISSION_PERCENT ?? '2'),
    spreadPercent: parseFloat(process.env.EXCHANGE_SPREAD_PERCENT ?? '1'),
  },
});
