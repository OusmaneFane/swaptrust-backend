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
exports.TransactionsController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var swagger_1 = require("@nestjs/swagger");
var kyc_verified_guard_1 = require("../common/guards/kyc-verified.guard");
var TransactionsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Transactions'), (0, common_1.Controller)('transactions'), (0, common_1.UseGuards)(kyc_verified_guard_1.KycVerifiedGuard)];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _list_decorators;
    var _create_decorators;
    var _one_decorators;
    var _confirmSend_decorators;
    var _confirmReceive_decorators;
    var _cancel_decorators;
    var TransactionsController = _classThis = /** @class */ (function () {
        function TransactionsController_1(tx, upload) {
            this.tx = (__runInitializers(this, _instanceExtraInitializers), tx);
            this.upload = upload;
        }
        TransactionsController_1.prototype.list = function (userId, q) {
            return this.tx.listForUser(userId, q);
        };
        TransactionsController_1.prototype.create = function (userId, dto) {
            return this.tx.create(userId, dto);
        };
        TransactionsController_1.prototype.one = function (userId, id) {
            return this.tx.getOne(id, userId);
        };
        TransactionsController_1.prototype.confirmSend = function (userId, id, file) {
            var proofUrl = null;
            if (file)
                proofUrl = this.upload.saveFile(file, 'proofs');
            return this.tx.confirmSend(userId, id, proofUrl);
        };
        TransactionsController_1.prototype.confirmReceive = function (userId, id) {
            return this.tx.confirmReceive(userId, id);
        };
        TransactionsController_1.prototype.cancel = function (userId, id) {
            return this.tx.cancel(userId, id);
        };
        return TransactionsController_1;
    }());
    __setFunctionName(_classThis, "TransactionsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _list_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Historique' })];
        _create_decorators = [(0, common_1.Post)(), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Initier depuis deux ordres' })];
        _one_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Détail' })];
        _confirmSend_decorators = [(0, common_1.Post)(':id/confirm-send'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: {
                    type: 'object',
                    properties: { proof: { type: 'string', format: 'binary' } },
                },
            }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('proof', { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 5242880 } })), (0, swagger_1.ApiOperation)({ summary: 'Confirmer envoi + preuve' })];
        _confirmReceive_decorators = [(0, common_1.Post)(':id/confirm-receive'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Confirmer réception' })];
        _cancel_decorators = [(0, common_1.Post)(':id/cancel'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Annuler' })];
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _create_decorators, { kind: "method", name: "create", static: false, private: false, access: { has: function (obj) { return "create" in obj; }, get: function (obj) { return obj.create; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _one_decorators, { kind: "method", name: "one", static: false, private: false, access: { has: function (obj) { return "one" in obj; }, get: function (obj) { return obj.one; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _confirmSend_decorators, { kind: "method", name: "confirmSend", static: false, private: false, access: { has: function (obj) { return "confirmSend" in obj; }, get: function (obj) { return obj.confirmSend; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _confirmReceive_decorators, { kind: "method", name: "confirmReceive", static: false, private: false, access: { has: function (obj) { return "confirmReceive" in obj; }, get: function (obj) { return obj.confirmReceive; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _cancel_decorators, { kind: "method", name: "cancel", static: false, private: false, access: { has: function (obj) { return "cancel" in obj; }, get: function (obj) { return obj.cancel; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        TransactionsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return TransactionsController = _classThis;
}();
exports.TransactionsController = TransactionsController;
