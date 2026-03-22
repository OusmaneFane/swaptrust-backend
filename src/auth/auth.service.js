"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
var common_1 = require("@nestjs/common");
var bcryptjs_1 = require("bcryptjs");
var OTP_TTL_SEC = 300;
var OTP_FALLBACK = new Map();
var AuthService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var AuthService = _classThis = /** @class */ (function () {
        function AuthService_1(prisma, jwt, config, redis, sms) {
            this.prisma = prisma;
            this.jwt = jwt;
            this.config = config;
            this.redis = redis;
            this.sms = sms;
        }
        AuthService_1.prototype.signAccessToken = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.jwt.signAsync({ sub: userId }, {
                            secret: this.config.get('jwt.accessSecret'),
                            expiresIn: this.config.get('jwt.accessExpires'),
                        })];
                });
            });
        };
        AuthService_1.prototype.signRefreshToken = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this.jwt.signAsync({ sub: userId }, {
                            secret: this.config.get('jwt.refreshSecret'),
                            expiresIn: this.config.get('jwt.refreshExpires'),
                        })];
                });
            });
        };
        AuthService_1.prototype.register = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var existing, password, user, refreshToken, accessToken;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { email: dto.email } })];
                        case 1:
                            existing = _a.sent();
                            if (existing)
                                throw new common_1.ConflictException('Email already in use');
                            return [4 /*yield*/, bcryptjs_1.default.hash(dto.password, 12)];
                        case 2:
                            password = _a.sent();
                            return [4 /*yield*/, this.prisma.user.create({
                                    data: {
                                        name: dto.name,
                                        email: dto.email,
                                        password: password,
                                        phoneMali: dto.phoneMali,
                                        phoneRussia: dto.phoneRussia,
                                        countryResidence: dto.countryResidence,
                                    },
                                })];
                        case 3:
                            user = _a.sent();
                            return [4 /*yield*/, this.signRefreshToken(user.id)];
                        case 4:
                            refreshToken = _a.sent();
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: user.id },
                                    data: { refreshToken: refreshToken },
                                })];
                        case 5:
                            _a.sent();
                            return [4 /*yield*/, this.signAccessToken(user.id)];
                        case 6:
                            accessToken = _a.sent();
                            return [2 /*return*/, { accessToken: accessToken, refreshToken: refreshToken }];
                    }
                });
            });
        };
        AuthService_1.prototype.login = function (dto) {
            return __awaiter(this, void 0, void 0, function () {
                var user, ok, refreshToken, accessToken;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { email: dto.email } })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new common_1.UnauthorizedException('Invalid credentials');
                            return [4 /*yield*/, bcryptjs_1.default.compare(dto.password, user.password)];
                        case 2:
                            ok = _a.sent();
                            if (!ok)
                                throw new common_1.UnauthorizedException('Invalid credentials');
                            if (user.isBanned)
                                throw new common_1.UnauthorizedException('Account suspended');
                            return [4 /*yield*/, this.signRefreshToken(user.id)];
                        case 3:
                            refreshToken = _a.sent();
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: user.id },
                                    data: { refreshToken: refreshToken },
                                })];
                        case 4:
                            _a.sent();
                            return [4 /*yield*/, this.signAccessToken(user.id)];
                        case 5:
                            accessToken = _a.sent();
                            return [2 /*return*/, { accessToken: accessToken, refreshToken: refreshToken }];
                    }
                });
            });
        };
        AuthService_1.prototype.logout = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.update({
                                where: { id: userId },
                                data: { refreshToken: null },
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/, { loggedOut: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.refreshTokens = function (userId, refreshToken) {
            return __awaiter(this, void 0, void 0, function () {
                var user, newRefresh, accessToken;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({ where: { id: userId } })];
                        case 1:
                            user = _a.sent();
                            if (!(user === null || user === void 0 ? void 0 : user.refreshToken) || user.refreshToken !== refreshToken) {
                                throw new common_1.UnauthorizedException();
                            }
                            return [4 /*yield*/, this.signRefreshToken(user.id)];
                        case 2:
                            newRefresh = _a.sent();
                            return [4 /*yield*/, this.prisma.user.update({
                                    where: { id: user.id },
                                    data: { refreshToken: newRefresh },
                                })];
                        case 3:
                            _a.sent();
                            return [4 /*yield*/, this.signAccessToken(user.id)];
                        case 4:
                            accessToken = _a.sent();
                            return [2 /*return*/, { accessToken: accessToken, refreshToken: newRefresh }];
                    }
                });
            });
        };
        AuthService_1.prototype.sendOtp = function (phone) {
            return __awaiter(this, void 0, void 0, function () {
                var code, key, fromRedis;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            code = String(Math.floor(100000 + Math.random() * 900000));
                            key = "otp:".concat(phone);
                            return [4 /*yield*/, this.redis.setex(key, OTP_TTL_SEC, code)];
                        case 1:
                            _a.sent();
                            return [4 /*yield*/, this.redis.get(key)];
                        case 2:
                            fromRedis = _a.sent();
                            if (fromRedis === null) {
                                OTP_FALLBACK.set(phone, { code: code, exp: Date.now() + OTP_TTL_SEC * 1000 });
                            }
                            return [4 /*yield*/, this.sms.sendOtp(phone, code)];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, { sent: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.verifyOtp = function (phone, code) {
            return __awaiter(this, void 0, void 0, function () {
                var key, expected, fb;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            key = "otp:".concat(phone);
                            return [4 /*yield*/, this.redis.get(key)];
                        case 1:
                            expected = _a.sent();
                            if (expected === null) {
                                fb = OTP_FALLBACK.get(phone);
                                if (!fb || fb.exp < Date.now())
                                    throw new common_1.UnauthorizedException('Invalid OTP');
                                expected = fb.code;
                                if (expected !== code)
                                    throw new common_1.UnauthorizedException('Invalid OTP');
                                OTP_FALLBACK.delete(phone);
                                return [2 /*return*/, { verified: true }];
                            }
                            if (expected !== code)
                                throw new common_1.UnauthorizedException('Invalid OTP');
                            return [4 /*yield*/, this.redis.del(key)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/, { verified: true }];
                    }
                });
            });
        };
        AuthService_1.prototype.getProfile = function (userId) {
            return __awaiter(this, void 0, void 0, function () {
                var user;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.user.findUnique({
                                where: { id: userId },
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phoneMali: true,
                                    phoneRussia: true,
                                    countryResidence: true,
                                    avatar: true,
                                    kycStatus: true,
                                    isAdmin: true,
                                    ratingAvg: true,
                                    transactionsCount: true,
                                    createdAt: true,
                                },
                            })];
                        case 1:
                            user = _a.sent();
                            if (!user)
                                throw new common_1.UnauthorizedException();
                            return [2 /*return*/, user];
                    }
                });
            });
        };
        return AuthService_1;
    }());
    __setFunctionName(_classThis, "AuthService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AuthService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AuthService = _classThis;
}();
exports.AuthService = AuthService;
