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
exports.KycController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var swagger_1 = require("@nestjs/swagger");
var admin_guard_1 = require("../common/guards/admin.guard");
var KycController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('KYC'), (0, common_1.Controller)('kyc')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _submit_decorators;
    var _status_decorators;
    var _approve_decorators;
    var _reject_decorators;
    var KycController = _classThis = /** @class */ (function () {
        function KycController_1(kyc) {
            this.kyc = (__runInitializers(this, _instanceExtraInitializers), kyc);
        }
        KycController_1.prototype.submit = function (userId, dto, files) {
            var _a, _b, _c;
            var front = (_a = files.front) === null || _a === void 0 ? void 0 : _a[0];
            var back = (_b = files.back) === null || _b === void 0 ? void 0 : _b[0];
            var selfie = (_c = files.selfie) === null || _c === void 0 ? void 0 : _c[0];
            if (!front || !back || !selfie)
                throw new common_1.BadRequestException('Missing files');
            return this.kyc.submit(userId, dto.docType, { front: front, back: back, selfie: selfie });
        };
        KycController_1.prototype.status = function (userId) {
            return this.kyc.status(userId);
        };
        KycController_1.prototype.approve = function (adminId, id) {
            return this.kyc.approve(adminId, id);
        };
        KycController_1.prototype.reject = function (adminId, id, note) {
            if (!note)
                throw new common_1.BadRequestException('note required');
            return this.kyc.reject(adminId, id, note);
        };
        return KycController_1;
    }());
    __setFunctionName(_classThis, "KycController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _submit_decorators = [(0, common_1.Post)('submit'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: {
                    type: 'object',
                    properties: {
                        docType: { type: 'string' },
                        front: { type: 'string', format: 'binary' },
                        back: { type: 'string', format: 'binary' },
                        selfie: { type: 'string', format: 'binary' },
                    },
                },
            }), (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
                { name: 'front', maxCount: 1 },
                { name: 'back', maxCount: 1 },
                { name: 'selfie', maxCount: 1 },
            ], { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 5242880 } })), (0, swagger_1.ApiOperation)({ summary: 'Soumettre documents KYC' })];
        _status_decorators = [(0, common_1.Get)('status'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Statut KYC' })];
        _approve_decorators = [(0, common_1.Put)('admin/:id/approve'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: '[Admin] Approuver KYC' })];
        _reject_decorators = [(0, common_1.Put)('admin/:id/reject'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: '[Admin] Rejeter KYC' })];
        __esDecorate(_classThis, null, _submit_decorators, { kind: "method", name: "submit", static: false, private: false, access: { has: function (obj) { return "submit" in obj; }, get: function (obj) { return obj.submit; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _status_decorators, { kind: "method", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _approve_decorators, { kind: "method", name: "approve", static: false, private: false, access: { has: function (obj) { return "approve" in obj; }, get: function (obj) { return obj.approve; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reject_decorators, { kind: "method", name: "reject", static: false, private: false, access: { has: function (obj) { return "reject" in obj; }, get: function (obj) { return obj.reject; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        KycController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return KycController = _classThis;
}();
exports.KycController = KycController;
