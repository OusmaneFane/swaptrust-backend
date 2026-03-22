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
exports.OrdersController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var kyc_verified_guard_1 = require("../common/guards/kyc-verified.guard");
var OrdersController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Orders'), (0, common_1.Controller)('orders')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _list_decorators;
    var _mine_decorators;
    var _create_decorators;
    var _matches_decorators;
    var _one_decorators;
    var _update_decorators;
    var _cancel_decorators;
    var OrdersController = _classThis = /** @class */ (function () {
        function OrdersController_1(orders, matching) {
            this.orders = (__runInitializers(this, _instanceExtraInitializers), orders);
            this.matching = matching;
        }
        OrdersController_1.prototype.list = function (q) {
            return this.orders.listActive(q);
        };
        OrdersController_1.prototype.mine = function (userId) {
            return this.orders.mine(userId);
        };
        OrdersController_1.prototype.create = function (userId, dto) {
            return this.orders.create(userId, dto);
        };
        OrdersController_1.prototype.matches = function (id) {
            return this.matching.findMatches(id);
        };
        OrdersController_1.prototype.one = function (id) {
            return this.orders.getOne(id);
        };
        OrdersController_1.prototype.update = function (userId, id, dto) {
            return this.orders.updateOwn(userId, id, dto);
        };
        OrdersController_1.prototype.cancel = function (userId, id) {
            return this.orders.cancelOwn(userId, id);
        };
        return OrdersController_1;
    }());
    __setFunctionName(_classThis, "OrdersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _list_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Lister ordres (filtres)' })];
        _mine_decorators = [(0, common_1.Get)('mine'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Mes ordres' })];
        _create_decorators = [(0, common_1.Post)(), (0, common_1.UseGuards)(kyc_verified_guard_1.KycVerifiedGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Créer un ordre' })];
        _matches_decorators = [(0, common_1.Get)(':id/matches'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Ordres compatibles' })];
        _one_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Détail ordre' })];
        _update_decorators = [(0, common_1.Put)(':id'), (0, common_1.UseGuards)(kyc_verified_guard_1.KycVerifiedGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Modifier son ordre' })];
        _cancel_decorators = [(0, common_1.Delete)(':id'), (0, common_1.UseGuards)(kyc_verified_guard_1.KycVerifiedGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Annuler son ordre' })];
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _mine_decorators, { kind: "method", name: "mine", static: false, private: false, access: { has: function (obj) { return "mine" in obj; }, get: function (obj) { return obj.mine; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _matches_decorators, { kind: "method", name: "matches", static: false, private: false, access: { has: function (obj) { return "matches" in obj; }, get: function (obj) { return obj.matches; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _one_decorators, { kind: "method", name: "one", static: false, private: false, access: { has: function (obj) { return "one" in obj; }, get: function (obj) { return obj.one; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _update_decorators, { kind: "method", name: "update", static: false, private: false, access: { has: function (obj) { return "update" in obj; }, get: function (obj) { return obj.update; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        OrdersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return OrdersController = _classThis;
}();
exports.OrdersController = OrdersController;
