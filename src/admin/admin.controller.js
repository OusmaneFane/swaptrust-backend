"use strict";
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var admin_guard_1 = require("../common/guards/admin.guard");
var AdminController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Admin'), (0, common_1.Controller)('admin'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, swagger_1.ApiBearerAuth)('access-token')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _dashboard_decorators;
    var _users_decorators;
    var _ban_decorators;
    var _transactions_decorators;
    var _disputes_decorators;
    var _resolve_decorators;
    var _kycPending_decorators;
    var AdminController = _classThis = /** @class */ (function () {
        function AdminController_1(admin) {
            this.admin = (__runInitializers(this, _instanceExtraInitializers), admin);
        }
        AdminController_1.prototype.dashboard = function () {
            return this.admin.dashboard();
        };
        AdminController_1.prototype.users = function (search) {
            return this.admin.users(search);
        };
        AdminController_1.prototype.ban = function (id) {
            return this.admin.banUser(id);
        };
        AdminController_1.prototype.transactions = function () {
            return this.admin.transactions();
        };
        AdminController_1.prototype.disputes = function () {
            return this.admin.disputesQueue();
        };
        AdminController_1.prototype.resolve = function (adminId, id, resolution) {
            if (!resolution)
                throw new common_1.BadRequestException('resolution required');
            return this.admin.resolveDispute(adminId, id, resolution);
        };
        AdminController_1.prototype.kycPending = function () {
            return this.admin.kycPending();
        };
        return AdminController_1;
    }());
    __setFunctionName(_classThis, "AdminController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _dashboard_decorators = [(0, common_1.Get)('dashboard'), (0, swagger_1.ApiOperation)({ summary: 'KPIs' })];
        _users_decorators = [(0, common_1.Get)('users'), (0, swagger_1.ApiOperation)({ summary: 'Utilisateurs' })];
        _ban_decorators = [(0, common_1.Put)('users/:id/ban'), (0, swagger_1.ApiOperation)({ summary: 'Bannir' })];
        _transactions_decorators = [(0, common_1.Get)('transactions'), (0, swagger_1.ApiOperation)({ summary: 'Transactions' })];
        _disputes_decorators = [(0, common_1.Get)('disputes'), (0, swagger_1.ApiOperation)({ summary: 'Litiges ouverts' })];
        _resolve_decorators = [(0, common_1.Put)('disputes/:id/resolve'), (0, swagger_1.ApiOperation)({ summary: 'Résoudre litige' })];
        _kycPending_decorators = [(0, common_1.Get)('kyc/pending'), (0, swagger_1.ApiOperation)({ summary: 'KYC en attente' })];
        __esDecorate(_classThis, null, _dashboard_decorators, { kind: "method", name: "dashboard", static: false, private: false, access: { has: function (obj) { return "dashboard" in obj; }, get: function (obj) { return obj.dashboard; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _users_decorators, { kind: "method", name: "users", static: false, private: false, access: { has: function (obj) { return "users" in obj; }, get: function (obj) { return obj.users; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _ban_decorators, { kind: "method", name: "ban", static: false, private: false, access: { has: function (obj) { return "ban" in obj; }, get: function (obj) { return obj.ban; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _transactions_decorators, { kind: "method", name: "transactions", static: false, private: false, access: { has: function (obj) { return "transactions" in obj; }, get: function (obj) { return obj.transactions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _disputes_decorators, { kind: "method", name: "disputes", static: false, private: false, access: { has: function (obj) { return "disputes" in obj; }, get: function (obj) { return obj.disputes; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolve_decorators, { kind: "method", name: "resolve", static: false, private: false, access: { has: function (obj) { return "resolve" in obj; }, get: function (obj) { return obj.resolve; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _kycPending_decorators, { kind: "method", name: "kycPending", static: false, private: false, access: { has: function (obj) { return "kycPending" in obj; }, get: function (obj) { return obj.kycPending; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        AdminController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return AdminController = _classThis;
}();
exports.AdminController = AdminController;
