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
exports.RatesService = void 0;
var common_1 = require("@nestjs/common");
var axios_1 = require("axios");
var client_1 = require("@prisma/client");
var RatesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var RatesService = _classThis = /** @class */ (function () {
        function RatesService_1(prisma, config, redis) {
            this.prisma = prisma;
            this.config = config;
            this.redis = redis;
            this.logger = new common_1.Logger(RatesService.name);
        }
        RatesService_1.prototype.cacheKey = function (from, to) {
            return "rate:".concat(from, ":").concat(to);
        };
        /** Taux `from` → `to` (multiplicateur décimal). */
        RatesService_1.prototype.getRateDecimal = function (from, to) {
            return __awaiter(this, void 0, void 0, function () {
                var cached, row, v, latest, hit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (from === to)
                                return [2 /*return*/, 1];
                            return [4 /*yield*/, this.redis.get(this.cacheKey(from, to))];
                        case 1:
                            cached = _a.sent();
                            if (cached)
                                return [2 /*return*/, parseFloat(cached)];
                            return [4 /*yield*/, this.prisma.exchangeRate.findFirst({
                                    where: { fromCurrency: from, toCurrency: to },
                                    orderBy: { fetchedAt: 'desc' },
                                })];
                        case 2:
                            row = _a.sent();
                            if (!row) return [3 /*break*/, 4];
                            v = row.rate.toNumber();
                            return [4 /*yield*/, this.redis.setex(this.cacheKey(from, to), 600, String(v))];
                        case 3:
                            _a.sent();
                            return [2 /*return*/, v];
                        case 4: return [4 /*yield*/, this.fetchAndStore()];
                        case 5:
                            latest = _a.sent();
                            hit = latest.find(function (r) { return r.from === from && r.to === to; });
                            if (!hit)
                                throw new common_1.ServiceUnavailableException('Rate unavailable');
                            return [2 /*return*/, hit.rate];
                    }
                });
            });
        };
        RatesService_1.prototype.fetchAndStore = function () {
            return __awaiter(this, void 0, void 0, function () {
                var apiKey, baseUrl, pairs, fallback, _i, fallback_1, f, url, data, r, xofPerUsd, rubPerUsd, xofToRub, rubToXof, out, _a, out_1, f;
                var _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            apiKey = this.config.get('exchangeRate.apiKey');
                            baseUrl = (_b = this.config.get('exchangeRate.apiUrl')) !== null && _b !== void 0 ? _b : 'https://openexchangerates.org/api';
                            pairs = [
                                ['XOF', 'RUB'],
                                ['RUB', 'XOF'],
                            ];
                            if (!!apiKey) return [3 /*break*/, 6];
                            this.logger.warn('EXCHANGE_RATE_API_KEY missing — using fallback static rates');
                            fallback = [
                                { from: 'XOF', to: 'RUB', rate: 0.14 },
                                { from: 'RUB', to: 'XOF', rate: 7.14 },
                            ];
                            _i = 0, fallback_1 = fallback;
                            _c.label = 1;
                        case 1:
                            if (!(_i < fallback_1.length)) return [3 /*break*/, 5];
                            f = fallback_1[_i];
                            return [4 /*yield*/, this.prisma.exchangeRate.create({
                                    data: {
                                        fromCurrency: f.from,
                                        toCurrency: f.to,
                                        rate: new client_1.Prisma.Decimal(f.rate.toFixed(6)),
                                        source: 'fallback',
                                    },
                                })];
                        case 2:
                            _c.sent();
                            return [4 /*yield*/, this.redis.setex(this.cacheKey(f.from, f.to), 3600, String(f.rate))];
                        case 3:
                            _c.sent();
                            _c.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 1];
                        case 5: return [2 /*return*/, fallback];
                        case 6:
                            url = "".concat(baseUrl.replace(/\/$/, ''), "/latest.json");
                            return [4 /*yield*/, axios_1.default.get(url, {
                                    params: { app_id: apiKey },
                                })];
                        case 7:
                            data = (_c.sent()).data;
                            r = data.rates;
                            if (!(r === null || r === void 0 ? void 0 : r.XOF) || !(r === null || r === void 0 ? void 0 : r.RUB))
                                throw new Error('Invalid OXR response');
                            xofPerUsd = r.XOF;
                            rubPerUsd = r.RUB;
                            xofToRub = rubPerUsd / xofPerUsd;
                            rubToXof = xofPerUsd / rubPerUsd;
                            out = [
                                { from: 'XOF', to: 'RUB', rate: xofToRub },
                                { from: 'RUB', to: 'XOF', rate: rubToXof },
                            ];
                            _a = 0, out_1 = out;
                            _c.label = 8;
                        case 8:
                            if (!(_a < out_1.length)) return [3 /*break*/, 12];
                            f = out_1[_a];
                            return [4 /*yield*/, this.prisma.exchangeRate.create({
                                    data: {
                                        fromCurrency: f.from,
                                        toCurrency: f.to,
                                        rate: new client_1.Prisma.Decimal(f.rate.toFixed(6)),
                                        source: 'openexchangerates',
                                    },
                                })];
                        case 9:
                            _c.sent();
                            return [4 /*yield*/, this.redis.setex(this.cacheKey(f.from, f.to), 900, String(f.rate))];
                        case 10:
                            _c.sent();
                            _c.label = 11;
                        case 11:
                            _a++;
                            return [3 /*break*/, 8];
                        case 12: return [2 /*return*/, out];
                    }
                });
            });
        };
        RatesService_1.prototype.current = function () {
            return __awaiter(this, void 0, void 0, function () {
                var xofRub, rubXof;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getRateDecimal('XOF', 'RUB')];
                        case 1:
                            xofRub = _a.sent();
                            return [4 /*yield*/, this.getRateDecimal('RUB', 'XOF')];
                        case 2:
                            rubXof = _a.sent();
                            return [2 /*return*/, { XOF_RUB: xofRub, RUB_XOF: rubXof, fetchedAt: new Date().toISOString() }];
                    }
                });
            });
        };
        RatesService_1.prototype.history24h = function () {
            return __awaiter(this, void 0, void 0, function () {
                var since;
                return __generator(this, function (_a) {
                    since = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    return [2 /*return*/, this.prisma.exchangeRate.findMany({
                            where: {
                                fromCurrency: 'XOF',
                                toCurrency: 'RUB',
                                fetchedAt: { gte: since },
                            },
                            orderBy: { fetchedAt: 'asc' },
                        })];
                });
            });
        };
        RatesService_1.prototype.calculate = function (amount, from, to) {
            return __awaiter(this, void 0, void 0, function () {
                var a, rate, converted;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            a = BigInt(amount);
                            return [4 /*yield*/, this.getRateDecimal(from, to)];
                        case 1:
                            rate = _a.sent();
                            converted = BigInt(Math.round(Number(a) * rate));
                            return [2 /*return*/, { amountFrom: a.toString(), from: from, to: to, rate: rate, amountTo: converted.toString() }];
                    }
                });
            });
        };
        return RatesService_1;
    }());
    __setFunctionName(_classThis, "RatesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        RatesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return RatesService = _classThis;
}();
exports.RatesService = RatesService;
