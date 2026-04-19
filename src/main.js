"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@nestjs/core");
var common_1 = require("@nestjs/common");
var swagger_1 = require("@nestjs/swagger");
var app_module_1 = require("./app.module");
var transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
var http_exception_filter_1 = require("./common/filters/http-exception.filter");
// Serialize BigInt in JSON responses
BigInt.prototype.toJSON = function toJSON() {
    return this.toString();
};
function bootstrap() {
    return __awaiter(this, void 0, void 0, function () {
        var app, logger, config, document, port;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, core_1.NestFactory.create(app_module_1.AppModule)];
                case 1:
                    app = _c.sent();
                    logger = new common_1.Logger('Bootstrap');
                    app.enableCors({
                        origin: (_a = process.env.FRONTEND_URL) !== null && _a !== void 0 ? _a : 'http://localhost:3000',
                        credentials: true,
                        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
                        allowedHeaders: ['Content-Type', 'Authorization'],
                    });
                    app.useGlobalPipes(new common_1.ValidationPipe({
                        whitelist: true,
                        forbidNonWhitelisted: true,
                        transform: true,
                        transformOptions: { enableImplicitConversion: true },
                    }));
                    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
                    app.useGlobalInterceptors(new common_1.ClassSerializerInterceptor(app.get(core_1.Reflector)), new transform_interceptor_1.TransformInterceptor());
                    app.setGlobalPrefix('api/v1');
                    config = new swagger_1.DocumentBuilder()
                        .setTitle('DoniSend API')
                        .setDescription("API d'échange sécurisé CFA ↔ Rouble")
                        .setVersion('1.0')
                        .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
                        .addTag('Auth')
                        .addTag('Users')
                        .addTag('KYC')
                        .addTag('Orders')
                        .addTag('Transactions')
                        .addTag('Chat')
                        .addTag('Reviews')
                        .addTag('Disputes')
                        .addTag('Notifications')
                        .addTag('Rates')
                        .addTag('Admin')
                        .addTag('Health')
                        .build();
                    document = swagger_1.SwaggerModule.createDocument(app, config);
                    swagger_1.SwaggerModule.setup('api/docs', app, document, {
                        swaggerOptions: { persistAuthorization: true },
                    });
                    port = parseInt((_b = process.env.PORT) !== null && _b !== void 0 ? _b : '3001', 10);
                    return [4 /*yield*/, app.listen(port)];
                case 2:
                    _c.sent();
                    logger.log("DoniSend API http://localhost:".concat(port));
                    logger.log("Swagger http://localhost:".concat(port, "/api/docs"));
                    return [2 /*return*/];
            }
        });
    });
}
bootstrap();
