"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (function () {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    return ({
        nodeEnv: (_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development',
        port: parseInt((_b = process.env.PORT) !== null && _b !== void 0 ? _b : '3001', 10),
        frontendUrl: (_c = process.env.FRONTEND_URL) !== null && _c !== void 0 ? _c : 'http://localhost:3000',
        databaseUrl: process.env.DATABASE_URL,
        redis: {
            host: (_d = process.env.REDIS_HOST) !== null && _d !== void 0 ? _d : 'localhost',
            port: parseInt((_e = process.env.REDIS_PORT) !== null && _e !== void 0 ? _e : '6379', 10),
        },
        twilio: {
            accountSid: process.env.TWILIO_ACCOUNT_SID,
            authToken: process.env.TWILIO_AUTH_TOKEN,
            phoneNumber: process.env.TWILIO_PHONE_NUMBER,
        },
        mail: {
            host: process.env.MAIL_HOST,
            port: parseInt((_f = process.env.MAIL_PORT) !== null && _f !== void 0 ? _f : '587', 10),
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
            from: (_g = process.env.MAIL_FROM) !== null && _g !== void 0 ? _g : 'noreply@swaptrust.com',
        },
        exchangeRate: {
            apiKey: process.env.EXCHANGE_RATE_API_KEY,
            apiUrl: (_h = process.env.EXCHANGE_RATE_API_URL) !== null && _h !== void 0 ? _h : 'https://openexchangerates.org/api',
        },
        upload: {
            dest: (_j = process.env.UPLOAD_DEST) !== null && _j !== void 0 ? _j : './uploads',
            maxFileSize: parseInt((_k = process.env.MAX_FILE_SIZE) !== null && _k !== void 0 ? _k : '5242880', 10),
        },
        commission: {
            platformPercent: parseFloat((_l = process.env.PLATFORM_COMMISSION_PERCENT) !== null && _l !== void 0 ? _l : '0'),
            spreadPercent: parseFloat((_m = process.env.EXCHANGE_SPREAD_PERCENT) !== null && _m !== void 0 ? _m : '1'),
        },
    });
});
