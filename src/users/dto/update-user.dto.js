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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUserDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var client_1 = require("@prisma/client");
var UpdateUserDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _phoneMali_decorators;
    var _phoneMali_initializers = [];
    var _phoneMali_extraInitializers = [];
    var _phoneRussia_decorators;
    var _phoneRussia_initializers = [];
    var _phoneRussia_extraInitializers = [];
    var _countryResidence_decorators;
    var _countryResidence_initializers = [];
    var _countryResidence_extraInitializers = [];
    return _a = /** @class */ (function () {
            function UpdateUserDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.phoneMali = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _phoneMali_initializers, void 0));
                this.phoneRussia = (__runInitializers(this, _phoneMali_extraInitializers), __runInitializers(this, _phoneRussia_initializers, void 0));
                this.countryResidence = (__runInitializers(this, _phoneRussia_extraInitializers), __runInitializers(this, _countryResidence_initializers, void 0));
                __runInitializers(this, _countryResidence_extraInitializers);
            }
            return UpdateUserDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)(), (0, class_validator_1.MinLength)(2)];
            _phoneMali_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsMobilePhone)()];
            _phoneRussia_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsMobilePhone)()];
            _countryResidence_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.CountryResidence }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.CountryResidence)];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _phoneMali_decorators, { kind: "field", name: "phoneMali", static: false, private: false, access: { has: function (obj) { return "phoneMali" in obj; }, get: function (obj) { return obj.phoneMali; }, set: function (obj, value) { obj.phoneMali = value; } }, metadata: _metadata }, _phoneMali_initializers, _phoneMali_extraInitializers);
            __esDecorate(null, null, _phoneRussia_decorators, { kind: "field", name: "phoneRussia", static: false, private: false, access: { has: function (obj) { return "phoneRussia" in obj; }, get: function (obj) { return obj.phoneRussia; }, set: function (obj, value) { obj.phoneRussia = value; } }, metadata: _metadata }, _phoneRussia_initializers, _phoneRussia_extraInitializers);
            __esDecorate(null, null, _countryResidence_decorators, { kind: "field", name: "countryResidence", static: false, private: false, access: { has: function (obj) { return "countryResidence" in obj; }, get: function (obj) { return obj.countryResidence; }, set: function (obj, value) { obj.countryResidence = value; } }, metadata: _metadata }, _countryResidence_initializers, _countryResidence_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.UpdateUserDto = UpdateUserDto;
