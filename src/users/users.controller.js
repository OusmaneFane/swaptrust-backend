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
exports.UsersController = void 0;
var common_1 = require("@nestjs/common");
var platform_express_1 = require("@nestjs/platform-express");
var multer_1 = require("multer");
var swagger_1 = require("@nestjs/swagger");
var admin_guard_1 = require("../common/guards/admin.guard");
var UsersController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Users'), (0, common_1.Controller)('users')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _list_decorators;
    var _updateMe_decorators;
    var _avatar_decorators;
    var _deleteMe_decorators;
    var _getOne_decorators;
    var _reviews_decorators;
    var UsersController = _classThis = /** @class */ (function () {
        function UsersController_1(users, upload) {
            this.users = (__runInitializers(this, _instanceExtraInitializers), users);
            this.upload = upload;
        }
        UsersController_1.prototype.list = function () {
            return this.users.listForAdmin();
        };
        UsersController_1.prototype.updateMe = function (userId, dto) {
            return this.users.updateMe(userId, dto);
        };
        UsersController_1.prototype.avatar = function (userId, file) {
            if (!file)
                throw new common_1.BadRequestException('file required');
            var rel = this.upload.saveFile(file, 'avatars');
            return this.users.setAvatar(userId, rel);
        };
        UsersController_1.prototype.deleteMe = function (userId) {
            return this.users.deleteMe(userId);
        };
        UsersController_1.prototype.getOne = function (id) {
            return this.users.getPublicProfile(id);
        };
        UsersController_1.prototype.reviews = function (id) {
            return this.users.getReviewsForUser(id);
        };
        return UsersController_1;
    }());
    __setFunctionName(_classThis, "UsersController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _list_decorators = [(0, common_1.Get)(), (0, common_1.UseGuards)(admin_guard_1.AdminGuard), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Liste utilisateurs (admin)' })];
        _updateMe_decorators = [(0, common_1.Put)('me'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Modifier son profil' })];
        _avatar_decorators = [(0, common_1.Post)('me/avatar'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiConsumes)('multipart/form-data'), (0, swagger_1.ApiBody)({
                schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
            }), (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
                storage: (0, multer_1.memoryStorage)(),
                limits: { fileSize: 5242880 },
            })), (0, swagger_1.ApiOperation)({ summary: 'Upload avatar' })];
        _deleteMe_decorators = [(0, common_1.Delete)('me'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Supprimer son compte' })];
        _getOne_decorators = [(0, common_1.Get)(':id'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Profil public' })];
        _reviews_decorators = [(0, common_1.Get)(':id/reviews'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Avis reçus' })];
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _updateMe_decorators, { kind: "method", name: "updateMe", static: false, private: false, access: { has: function (obj) { return "updateMe" in obj; }, get: function (obj) { return obj.updateMe; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _avatar_decorators, { kind: "method", name: "avatar", static: false, private: false, access: { has: function (obj) { return "avatar" in obj; }, get: function (obj) { return obj.avatar; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _deleteMe_decorators, { kind: "method", name: "deleteMe", static: false, private: false, access: { has: function (obj) { return "deleteMe" in obj; }, get: function (obj) { return obj.deleteMe; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getOne_decorators, { kind: "method", name: "getOne", static: false, private: false, access: { has: function (obj) { return "getOne" in obj; }, get: function (obj) { return obj.getOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _reviews_decorators, { kind: "method", name: "reviews", static: false, private: false, access: { has: function (obj) { return "reviews" in obj; }, get: function (obj) { return obj.reviews; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        UsersController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return UsersController = _classThis;
}();
exports.UsersController = UsersController;
