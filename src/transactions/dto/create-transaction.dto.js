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
exports.CreateTransactionDto = void 0;
var swagger_1 = require("@nestjs/swagger");
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var CreateTransactionDto = function () {
    var _a;
    var _myOrderId_decorators;
    var _myOrderId_initializers = [];
    var _myOrderId_extraInitializers = [];
    var _peerOrderId_decorators;
    var _peerOrderId_initializers = [];
    var _peerOrderId_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateTransactionDto() {
                this.myOrderId = __runInitializers(this, _myOrderId_initializers, void 0);
                this.peerOrderId = (__runInitializers(this, _myOrderId_extraInitializers), __runInitializers(this, _peerOrderId_initializers, void 0));
                __runInitializers(this, _peerOrderId_extraInitializers);
            }
            return CreateTransactionDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _myOrderId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Mon ordre' }), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            _peerOrderId_decorators = [(0, swagger_1.ApiProperty)({ description: 'Ordre du contrepartie' }), (0, class_transformer_1.Type)(function () { return Number; }), (0, class_validator_1.IsInt)(), (0, class_validator_1.Min)(1)];
            __esDecorate(null, null, _myOrderId_decorators, { kind: "field", name: "myOrderId", static: false, private: false, access: { has: function (obj) { return "myOrderId" in obj; }, get: function (obj) { return obj.myOrderId; }, set: function (obj, value) { obj.myOrderId = value; } }, metadata: _metadata }, _myOrderId_initializers, _myOrderId_extraInitializers);
            __esDecorate(null, null, _peerOrderId_decorators, { kind: "field", name: "peerOrderId", static: false, private: false, access: { has: function (obj) { return "peerOrderId" in obj; }, get: function (obj) { return obj.peerOrderId; }, set: function (obj, value) { obj.peerOrderId = value; } }, metadata: _metadata }, _peerOrderId_initializers, _peerOrderId_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateTransactionDto = CreateTransactionDto;
