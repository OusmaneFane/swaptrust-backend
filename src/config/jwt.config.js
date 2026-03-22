"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('jwt', function () {
    var _a, _b, _c, _d;
    return ({
        accessSecret: (_a = process.env.JWT_ACCESS_SECRET) !== null && _a !== void 0 ? _a : 'dev_access_secret_change_me_min_32_characters',
        refreshSecret: (_b = process.env.JWT_REFRESH_SECRET) !== null && _b !== void 0 ? _b : 'dev_refresh_secret_change_me_min_32_chars',
        accessExpires: (_c = process.env.JWT_ACCESS_EXPIRES) !== null && _c !== void 0 ? _c : '15m',
        refreshExpires: (_d = process.env.JWT_REFRESH_EXPIRES) !== null && _d !== void 0 ? _d : '7d',
    });
});
