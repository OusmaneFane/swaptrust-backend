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
exports.CreateOrderDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var client_1 = require("@prisma/client");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var CreateOrderDto = function () {
    var _a;
    var _type_decorators;
    var _type_initializers = [];
    var _type_extraInitializers = [];
    var _amountFrom_decorators;
    var _amountFrom_initializers = [];
    var _amountFrom_extraInitializers = [];
    var _currencyFrom_decorators;
    var _currencyFrom_initializers = [];
    var _currencyFrom_extraInitializers = [];
    var _currencyTo_decorators;
    var _currencyTo_initializers = [];
    var _currencyTo_extraInitializers = [];
    var _paymentMethod_decorators;
    var _paymentMethod_initializers = [];
    var _paymentMethod_extraInitializers = [];
    var _phoneReceive_decorators;
    var _phoneReceive_initializers = [];
    var _phoneReceive_extraInitializers = [];
    var _note_decorators;
    var _note_initializers = [];
    var _note_extraInitializers = [];
    var _expiresAt_decorators;
    var _expiresAt_initializers = [];
    var _expiresAt_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateOrderDto() {
                this.type = __runInitializers(this, _type_initializers, void 0);
                this.amountFrom = (__runInitializers(this, _type_extraInitializers), __runInitializers(this, _amountFrom_initializers, void 0));
                this.currencyFrom = (__runInitializers(this, _amountFrom_extraInitializers), __runInitializers(this, _currencyFrom_initializers, void 0));
                this.currencyTo = (__runInitializers(this, _currencyFrom_extraInitializers), __runInitializers(this, _currencyTo_initializers, void 0));
                this.paymentMethod = (__runInitializers(this, _currencyTo_extraInitializers), __runInitializers(this, _paymentMethod_initializers, void 0));
                this.phoneReceive = (__runInitializers(this, _paymentMethod_extraInitializers), __runInitializers(this, _phoneReceive_initializers, void 0));
                this.note = (__runInitializers(this, _phoneReceive_extraInitializers), __runInitializers(this, _note_initializers, void 0));
                this.expiresAt = (__runInitializers(this, _note_extraInitializers), __runInitializers(this, _expiresAt_initializers, void 0));
                __runInitializers(this, _expiresAt_extraInitializers);
            }
            return CreateOrderDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _type_decorators = [(0, swagger_1.ApiProperty)({ enum: client_1.OrderType }), (0, class_validator_1.IsEnum)(client_1.OrderType)];
            _amountFrom_decorators = [(0, swagger_1.ApiProperty)({ example: '5000000', description: 'Montant source (minor units / centimes)' }), (0, class_transformer_1.Type)(function () { return String; }), (0, class_validator_1.IsString)()];
            _currencyFrom_decorators = [(0, swagger_1.ApiProperty)({ example: 'XOF' }), (0, class_validator_1.IsString)()];
            _currencyTo_decorators = [(0, swagger_1.ApiProperty)({ example: 'RUB' }), (0, class_validator_1.IsString)()];
            _paymentMethod_decorators = [(0, swagger_1.ApiProperty)({ enum: client_1.PaymentMethod }), (0, class_validator_1.IsEnum)(client_1.PaymentMethod)];
            _phoneReceive_decorators = [(0, swagger_1.ApiProperty)(), (0, class_validator_1.IsMobilePhone)()];
            _note_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _expiresAt_decorators = [(0, swagger_1.ApiProperty)({ required: false }), (0, class_validator_1.IsOptional)(), (0, class_validator_1.IsDateString)()];
            __esDecorate(null, null, _type_decorators, { kind: "field", name: "type", static: false, private: false, access: { has: function (obj) { return "type" in obj; }, get: function (obj) { return obj.type; }, set: function (obj, value) { obj.type = value; } }, metadata: _metadata }, _type_initializers, _type_extraInitializers);
            __esDecorate(null, null, _amountFrom_decorators, { kind: "field", name: "amountFrom", static: false, private: false, access: { has: function (obj) { return "amountFrom" in obj; }, get: function (obj) { return obj.amountFrom; }, set: function (obj, value) { obj.amountFrom = value; } }, metadata: _metadata }, _amountFrom_initializers, _amountFrom_extraInitializers);
            __esDecorate(null, null, _currencyFrom_decorators, { kind: "field", name: "currencyFrom", static: false, private: false, access: { has: function (obj) { return "currencyFrom" in obj; }, get: function (obj) { return obj.currencyFrom; }, set: function (obj, value) { obj.currencyFrom = value; } }, metadata: _metadata }, _currencyFrom_initializers, _currencyFrom_extraInitializers);
            __esDecorate(null, null, _currencyTo_decorators, { kind: "field", name: "currencyTo", static: false, private: false, access: { has: function (obj) { return "currencyTo" in obj; }, get: function (obj) { return obj.currencyTo; }, set: function (obj, value) { obj.currencyTo = value; } }, metadata: _metadata }, _currencyTo_initializers, _currencyTo_extraInitializers);
            __esDecorate(null, null, _paymentMethod_decorators, { kind: "field", name: "paymentMethod", static: false, private: false, access: { has: function (obj) { return "paymentMethod" in obj; }, get: function (obj) { return obj.paymentMethod; }, set: function (obj, value) { obj.paymentMethod = value; } }, metadata: _metadata }, _paymentMethod_initializers, _paymentMethod_extraInitializers);
            __esDecorate(null, null, _phoneReceive_decorators, { kind: "field", name: "phoneReceive", static: false, private: false, access: { has: function (obj) { return "phoneReceive" in obj; }, get: function (obj) { return obj.phoneReceive; }, set: function (obj, value) { obj.phoneReceive = value; } }, metadata: _metadata }, _phoneReceive_initializers, _phoneReceive_extraInitializers);
            __esDecorate(null, null, _note_decorators, { kind: "field", name: "note", static: false, private: false, access: { has: function (obj) { return "note" in obj; }, get: function (obj) { return obj.note; }, set: function (obj, value) { obj.note = value; } }, metadata: _metadata }, _note_initializers, _note_extraInitializers);
            __esDecorate(null, null, _expiresAt_decorators, { kind: "field", name: "expiresAt", static: false, private: false, access: { has: function (obj) { return "expiresAt" in obj; }, get: function (obj) { return obj.expiresAt; }, set: function (obj, value) { obj.expiresAt = value; } }, metadata: _metadata }, _expiresAt_initializers, _expiresAt_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateOrderDto = CreateOrderDto;
