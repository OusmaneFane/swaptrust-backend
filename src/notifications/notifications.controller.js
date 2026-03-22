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
exports.NotificationsController = void 0;
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var NotificationsController = function () {
    var _classDecorators = [(0, swagger_1.ApiTags)('Notifications'), (0, common_1.Controller)('notifications')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _list_decorators;
    var _readAll_decorators;
    var _prefsGet_decorators;
    var _prefsPut_decorators;
    var _readOne_decorators;
    var _remove_decorators;
    var NotificationsController = _classThis = /** @class */ (function () {
        function NotificationsController_1(notifications) {
            this.notifications = (__runInitializers(this, _instanceExtraInitializers), notifications);
        }
        NotificationsController_1.prototype.list = function (userId) {
            return this.notifications.list(userId);
        };
        NotificationsController_1.prototype.readAll = function (userId) {
            return this.notifications.markAllRead(userId);
        };
        NotificationsController_1.prototype.prefsGet = function (userId) {
            return this.notifications.getPreferences(userId);
        };
        NotificationsController_1.prototype.prefsPut = function (userId, dto) {
            return this.notifications.updatePreferences(userId, dto);
        };
        NotificationsController_1.prototype.readOne = function (userId, id) {
            return this.notifications.markRead(userId, id);
        };
        NotificationsController_1.prototype.remove = function (userId, id) {
            return this.notifications.remove(userId, id);
        };
        return NotificationsController_1;
    }());
    __setFunctionName(_classThis, "NotificationsController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _list_decorators = [(0, common_1.Get)(), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Mes notifications' })];
        _readAll_decorators = [(0, common_1.Put)('read-all'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Tout marquer comme lu' })];
        _prefsGet_decorators = [(0, common_1.Get)('preferences'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Préférences' })];
        _prefsPut_decorators = [(0, common_1.Put)('preferences'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Modifier préférences' })];
        _readOne_decorators = [(0, common_1.Put)(':id/read'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Marquer une notification comme lue' })];
        _remove_decorators = [(0, common_1.Delete)(':id'), (0, swagger_1.ApiBearerAuth)('access-token'), (0, swagger_1.ApiOperation)({ summary: 'Supprimer une notification' })];
        __esDecorate(_classThis, null, _list_decorators, { kind: "method", name: "list", static: false, private: false, access: { has: function (obj) { return "list" in obj; }, get: function (obj) { return obj.list; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _readAll_decorators, { kind: "method", name: "readAll", static: false, private: false, access: { has: function (obj) { return "readAll" in obj; }, get: function (obj) { return obj.readAll; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _prefsGet_decorators, { kind: "method", name: "prefsGet", static: false, private: false, access: { has: function (obj) { return "prefsGet" in obj; }, get: function (obj) { return obj.prefsGet; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _prefsPut_decorators, { kind: "method", name: "prefsPut", static: false, private: false, access: { has: function (obj) { return "prefsPut" in obj; }, get: function (obj) { return obj.prefsPut; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _readOne_decorators, { kind: "method", name: "readOne", static: false, private: false, access: { has: function (obj) { return "readOne" in obj; }, get: function (obj) { return obj.readOne; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _remove_decorators, { kind: "method", name: "remove", static: false, private: false, access: { has: function (obj) { return "remove" in obj; }, get: function (obj) { return obj.remove; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        NotificationsController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return NotificationsController = _classThis;
}();
exports.NotificationsController = NotificationsController;
