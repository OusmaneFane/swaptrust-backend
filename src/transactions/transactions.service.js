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
exports.TransactionsService = void 0;
var common_1 = require("@nestjs/common");
var client_1 = require("@prisma/client");
var HOURS_48 = 48 * 60 * 60 * 1000;
var TransactionsService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var TransactionsService = _classThis = /** @class */ (function () {
        function TransactionsService_1(prisma, matching) {
            this.prisma = prisma;
            this.matching = matching;
        }
        TransactionsService_1.prototype.periodStart = function (period) {
            if (period === '7d')
                return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            if (period === '30d')
                return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            return undefined;
        };
        TransactionsService_1.prototype.listForUser = function (userId, q) {
            return __awaiter(this, void 0, void 0, function () {
                var since, base;
                return __generator(this, function (_a) {
                    since = this.periodStart(q.period);
                    base = {};
                    if (since)
                        base.initiatedAt = { gte: since };
                    if (q.status)
                        base.status = q.status;
                    if (q.direction === 'sent') {
                        base.senderId = userId;
                    }
                    else if (q.direction === 'received') {
                        base.receiverId = userId;
                    }
                    else {
                        base.OR = [{ senderId: userId }, { receiverId: userId }];
                    }
                    return [2 /*return*/, this.prisma.transaction.findMany({
                            where: base,
                            orderBy: { initiatedAt: 'desc' },
                            include: {
                                order: true,
                                sender: { select: { id: true, name: true, avatar: true } },
                                receiver: { select: { id: true, name: true, avatar: true } },
                            },
                        })];
                });
            });
        };
        TransactionsService_1.prototype.create = function (userId, dto) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, mine, peer, matches, ok, sendCfa, sendRub, senderId, receiverId, tx;
                var _this = this;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, Promise.all([
                                this.prisma.order.findUnique({
                                    where: { id: dto.myOrderId },
                                    include: { transaction: true },
                                }),
                                this.prisma.order.findUnique({
                                    where: { id: dto.peerOrderId },
                                    include: { transaction: true },
                                }),
                            ])];
                        case 1:
                            _a = _b.sent(), mine = _a[0], peer = _a[1];
                            if (!mine || !peer)
                                throw new common_1.NotFoundException('Order not found');
                            if (mine.userId !== userId)
                                throw new common_1.ForbiddenException();
                            if (mine.status !== client_1.OrderStatus.ACTIVE || peer.status !== client_1.OrderStatus.ACTIVE) {
                                throw new common_1.BadRequestException('Orders must be active');
                            }
                            if (mine.type === peer.type)
                                throw new common_1.BadRequestException('Order types must differ');
                            return [4 /*yield*/, this.matching.findMatches(mine.id)];
                        case 2:
                            matches = _b.sent();
                            ok = matches.some(function (m) { return m.id === peer.id; });
                            if (!ok)
                                throw new common_1.BadRequestException('Orders are not compatible');
                            if (peer.transaction || mine.transaction) {
                                throw new common_1.BadRequestException('Order already matched');
                            }
                            sendCfa = mine.type === client_1.OrderType.SEND_CFA ? mine : peer.type === client_1.OrderType.SEND_CFA ? peer : null;
                            sendRub = mine.type === client_1.OrderType.SEND_RUB ? mine : peer.type === client_1.OrderType.SEND_RUB ? peer : null;
                            if (!sendCfa || !sendRub)
                                throw new common_1.BadRequestException('Invalid pair');
                            senderId = sendCfa.userId;
                            receiverId = sendRub.userId;
                            return [4 /*yield*/, this.prisma.$transaction(function (db) { return __awaiter(_this, void 0, void 0, function () {
                                    var t;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, db.transaction.create({
                                                    data: {
                                                        orderId: mine.id,
                                                        peerOrderId: peer.id,
                                                        senderId: senderId,
                                                        receiverId: receiverId,
                                                        amountCfa: sendCfa.amountFrom,
                                                        amountRub: sendRub.amountFrom,
                                                        rate: sendCfa.rate,
                                                        commissionAmount: sendCfa.commission + sendRub.commission,
                                                        status: client_1.TransactionStatus.INITIATED,
                                                        expiresAt: new Date(Date.now() + HOURS_48),
                                                    },
                                                })];
                                            case 1:
                                                t = _a.sent();
                                                return [4 /*yield*/, db.order.update({
                                                        where: { id: mine.id },
                                                        data: { status: client_1.OrderStatus.MATCHED },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [4 /*yield*/, db.order.update({
                                                        where: { id: peer.id },
                                                        data: { status: client_1.OrderStatus.MATCHED },
                                                    })];
                                            case 3:
                                                _a.sent();
                                                return [2 /*return*/, t];
                                        }
                                    });
                                }); })];
                        case 3:
                            tx = _b.sent();
                            return [2 /*return*/, this.getOne(tx.id, userId)];
                    }
                });
            });
        };
        TransactionsService_1.prototype.getOne = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var t;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.transaction.findUnique({
                                where: { id: id },
                                include: {
                                    order: true,
                                    sender: { select: { id: true, name: true, email: true, avatar: true } },
                                    receiver: { select: { id: true, name: true, email: true, avatar: true } },
                                    messages: { take: 50, orderBy: { createdAt: 'desc' } },
                                    dispute: true,
                                    review: true,
                                },
                            })];
                        case 1:
                            t = _a.sent();
                            if (!t)
                                throw new common_1.NotFoundException();
                            if (t.senderId !== userId && t.receiverId !== userId)
                                throw new common_1.ForbiddenException();
                            return [2 /*return*/, t];
                    }
                });
            });
        };
        TransactionsService_1.prototype.confirmSend = function (userId, id, proofUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var t;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.transaction.findUnique({ where: { id: id } })];
                        case 1:
                            t = _a.sent();
                            if (!t)
                                throw new common_1.NotFoundException();
                            if (t.senderId !== userId)
                                throw new common_1.ForbiddenException();
                            if (t.status !== client_1.TransactionStatus.INITIATED) {
                                throw new common_1.BadRequestException('Invalid status');
                            }
                            return [2 /*return*/, this.prisma.transaction.update({
                                    where: { id: id },
                                    data: { status: client_1.TransactionStatus.SENDER_SENT, proofUrl: proofUrl !== null && proofUrl !== void 0 ? proofUrl : undefined },
                                })];
                    }
                });
            });
        };
        TransactionsService_1.prototype.confirmReceive = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var t;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.transaction.findUnique({ where: { id: id } })];
                        case 1:
                            t = _a.sent();
                            if (!t)
                                throw new common_1.NotFoundException();
                            if (t.receiverId !== userId)
                                throw new common_1.ForbiddenException();
                            if (t.status !== client_1.TransactionStatus.SENDER_SENT) {
                                throw new common_1.BadRequestException('Invalid status');
                            }
                            return [2 /*return*/, this.prisma.$transaction(function (db) { return __awaiter(_this, void 0, void 0, function () {
                                    var updated;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, db.transaction.update({
                                                    where: { id: id },
                                                    data: {
                                                        status: client_1.TransactionStatus.COMPLETED,
                                                        completedAt: new Date(),
                                                    },
                                                })];
                                            case 1:
                                                updated = _a.sent();
                                                return [4 /*yield*/, db.order.update({
                                                        where: { id: t.orderId },
                                                        data: { status: client_1.OrderStatus.COMPLETED },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                if (!t.peerOrderId) return [3 /*break*/, 4];
                                                return [4 /*yield*/, db.order.update({
                                                        where: { id: t.peerOrderId },
                                                        data: { status: client_1.OrderStatus.COMPLETED },
                                                    })];
                                            case 3:
                                                _a.sent();
                                                _a.label = 4;
                                            case 4: return [4 /*yield*/, db.user.update({
                                                    where: { id: t.senderId },
                                                    data: { transactionsCount: { increment: 1 } },
                                                })];
                                            case 5:
                                                _a.sent();
                                                return [4 /*yield*/, db.user.update({
                                                        where: { id: t.receiverId },
                                                        data: { transactionsCount: { increment: 1 } },
                                                    })];
                                            case 6:
                                                _a.sent();
                                                return [2 /*return*/, updated];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        TransactionsService_1.prototype.cancel = function (userId, id) {
            return __awaiter(this, void 0, void 0, function () {
                var t;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.prisma.transaction.findUnique({
                                where: { id: id },
                                include: { order: true },
                            })];
                        case 1:
                            t = _a.sent();
                            if (!t)
                                throw new common_1.NotFoundException();
                            if (t.senderId !== userId && t.receiverId !== userId)
                                throw new common_1.ForbiddenException();
                            if (t.status === client_1.TransactionStatus.COMPLETED ||
                                t.status === client_1.TransactionStatus.CANCELLED) {
                                throw new common_1.BadRequestException('Cannot cancel');
                            }
                            return [2 /*return*/, this.prisma.$transaction(function (db) { return __awaiter(_this, void 0, void 0, function () {
                                    var ids;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, db.transaction.update({
                                                    where: { id: id },
                                                    data: { status: client_1.TransactionStatus.CANCELLED },
                                                })];
                                            case 1:
                                                _a.sent();
                                                ids = [t.orderId, t.peerOrderId].filter(function (x) { return x != null; });
                                                return [4 /*yield*/, db.order.updateMany({
                                                        where: { id: { in: ids } },
                                                        data: { status: client_1.OrderStatus.ACTIVE },
                                                    })];
                                            case 2:
                                                _a.sent();
                                                return [2 /*return*/, { cancelled: true }];
                                        }
                                    });
                                }); })];
                    }
                });
            });
        };
        return TransactionsService_1;
    }());
    __setFunctionName(_classThis, "TransactionsService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransactionsService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransactionsService = _classThis;
}();
exports.TransactionsService = TransactionsService;
