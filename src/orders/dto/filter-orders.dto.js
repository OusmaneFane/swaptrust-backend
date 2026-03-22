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
exports.FilterOrdersDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var FilterOrdersDto = function () {
    var _a;
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _paymentMethod_decorators;
    var _paymentMethod_initializers = [];
    var _paymentMethod_extraInitializers = [];
    var _currencyFrom_decorators;
    var _currencyFrom_initializers = [];
    var _currencyFrom_extraInitializers = [];
    var _currencyTo_decorators;
    var _currencyTo_initializers = [];
    var _currencyTo_extraInitializers = [];
    var _skip_decorators;
    var _skip_initializers = [];
    var _skip_extraInitializers = [];
    var _take_decorators;
    var _take_initializers = [];
    var _take_extraInitializers = [];
    return _a = /** @class */ (function () {
            function FilterOrdersDto() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.status = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.paymentMethod = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _paymentMethod_initializers, void 0));
                this.currencyFrom = (__runInitializers(this, _paymentMethod_extraInitializers), __runInitializers(this, _currencyFrom_initializers, void 0));
                this.currencyTo = (__runInitializers(this, _currencyFrom_extraInitializers), __runInitializers(this, _currencyTo_initializers, void 0));
                this.skip = (__runInitializers(this, _currencyTo_extraInitializers), __runInitializers(this, _skip_initializers, void 0));
                this.take = (__runInitializers(this, _skip_extraInitializers), __runInitializers(this, _take_initializers, void 0));
                __runInitializers(this, _take_extraInitializers);
            }
            return FilterOrdersDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.OrderType }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.OrderType)];
            _status_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.OrderStatus }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.OrderStatus)];
            _paymentMethod_decorators = [(0, swagger_1.ApiPropertyOptional)({ enum: client_1.PaymentMethod }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsEnum)(client_1.PaymentMethod)];
            _currencyFrom_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _currencyTo_decorators = [(0, swagger_1.ApiPropertyOptional)(), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _skip_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 0 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; })];
            _take_decorators = [(0, swagger_1.ApiPropertyOptional)({ default: 20 }), (0, class_validator_1.IsOptional)(), (0, class_transformer_1.Type)(function () { return Number; })];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _paymentMethod_decorators, { kind: "field", name: "paymentMethod", static: false, private: false, access: { has: function (obj) { return "paymentMethod" in obj; }, get: function (obj) { return obj.paymentMethod; }, set: function (obj, value) { obj.paymentMethod = value; } }, metadata: _metadata }, _paymentMethod_initializers, _paymentMethod_extraInitializers);
            __esDecorate(null, null, _currencyFrom_decorators, { kind: "field", name: "currencyFrom", static: false, private: false, access: { has: function (obj) { return "currencyFrom" in obj; }, get: function (obj) { return obj.currencyFrom; }, set: function (obj, value) { obj.currencyFrom = value; } }, metadata: _metadata }, _currencyFrom_initializers, _currencyFrom_extraInitializers);
            __esDecorate(null, null, _currencyTo_decorators, { kind: "field", name: "currencyTo", static: false, private: false, access: { has: function (obj) { return "currencyTo" in obj; }, get: function (obj) { return obj.currencyTo; }, set: function (obj, value) { obj.currencyTo = value; } }, metadata: _metadata }, _currencyTo_initializers, _currencyTo_extraInitializers);
            __esDecorate(null, null, _skip_decorators, { kind: "field", name: "skip", static: false, private: false, access: { has: function (obj) { return "skip" in obj; }, get: function (obj) { return obj.skip; }, set: function (obj, value) { obj.skip = value; } }, metadata: _metadata }, _skip_initializers, _skip_extraInitializers);
            __esDecorate(null, null, _take_decorators, { kind: "field", name: "take", static: false, private: false, access: { has: function (obj) { return "take" in obj; }, get: function (obj) { return obj.take; }, set: function (obj, value) { obj.take = value; } }, metadata: _metadata }, _take_initializers, _take_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.FilterOrdersDto = FilterOrdersDto;
