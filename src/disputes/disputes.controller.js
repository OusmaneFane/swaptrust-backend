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
exports.DisputesController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var swagger_1 = require("@nestjs/swagger");
var admin_guard_1 = require("../common/guards/admin.guard");
var DisputesController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Disputes'), (0, common_1.Controller)('disputes')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _open_decorators;
    var _adminList_decorators;
    var _resolve_decorators;
    var _one_decorators;
    var _respond_decorators;
    var _attachment_decorators;
    var DisputesController = _classThis = /** @class */ (function () {
        function DisputesController_1(disputes) {
            this.disputes = (__runInitializers(this, _instanceExtraInitializers), disputes);
        }
        DisputesController_1.prototype.open = function (userId, id, dto) {
            return this.disputes.open(id, userId, dto);
        };
        DisputesController_1.prototype.adminList = function () {
            return this.disputes.listAdmin();
        };
        DisputesController_1.prototype.resolve = function (adminId, id, resolution) {
            if (!resolution)
                throw new common_1.BadRequestException('resolution required');
            return this.disputes.resolve(adminId, id, resolution);
        };
        DisputesController_1.prototype.one = function (userId, isAdmin, id) {
            return this.disputes.getOne(id, userId, !!isAdmin);
        };
        DisputesController_1.prototype.respond = function (userId, id, message) {
            if (!message)
                throw new common_1.BadRequestException('message required');
            return this.disputes.respond(id, userId, message);
        };
        DisputesController_1.prototype.attachment = function (userId, id, file) {
            if (!file)
                throw new common_1.BadRequestException('file required');
            return this.disputes.addAttachment(id, userId, file);
        };
        return DisputesController_1;
    }());
    __setFunctionName(_classThis, "DisputesController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _open_decorators = [(0, common_1.Post)('transactions/:id'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Ouvrir un litige' })];
        _adminList_decorators = [(0, common_1.Get)('admin'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: '[Admin] Litiges ouverts' })];
        _resolve_decorators = [(0, common_1.Put)('admin/:id/resolve'), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: '[Admin] Résoudre' })];
        _one_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Détail litige' })];
        _respond_decorators = [(0, common_1.Post)(':id/respond'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Répondre au litige' })];
        _attachment_decorators = [(0, common_1.Post)(':id/attachments'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
            }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 5242880 } })), (0, swagger_1.ApiOperation)({ summary: 'Ajouter une pièce jointe' })];
        __esDecorate(_classThis, null, _open_decorators, { kind: "method", name: "open", static: false, private: false, access: { has: function (obj) { return "open" in obj; }, get: function (obj) { return obj.open; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _adminList_decorators, { kind: "method", name: "adminList", static: false, private: false, access: { has: function (obj) { return "adminList" in obj; }, get: function (obj) { return obj.adminList; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _resolve_decorators, { kind: "method", name: "resolve", static: false, private: false, access: { has: function (obj) { return "resolve" in obj; }, get: function (obj) { return obj.resolve; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _one_decorators, { kind: "method", name: "one", static: false, private: false, access: { has: function (obj) { return "one" in obj; }, get: function (obj) { return obj.one; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _respond_decorators, { kind: "method", name: "respond", static: false, private: false, access: { has: function (obj) { return "respond" in obj; }, get: function (obj) { return obj.respond; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _attachment_decorators, { kind: "method", name: "attachment", static: false, private: false, access: { has: function (obj) { return "attachment" in obj; }, get: function (obj) { return obj.attachment; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        DisputesController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return DisputesController = _classThis;
}();
exports.DisputesController = DisputesController;
