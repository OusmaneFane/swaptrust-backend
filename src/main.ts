import { NestFactory, Reflector } from '@nestjs/core';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  Logger,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

// Serialize BigInt in JSON responses
(BigInt.prototype as { toJSON?: () => string }).toJSON = function toJSON() {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('SwapTrust API')
    .setDescription("API d'échange sécurisé CFA ↔ Rouble")
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth')
    .addTag('Users')
    .addTag('KYC')
    .addTag('Requests')
    .addTag('Transactions')
    .addTag('Chat')
    .addTag('Reviews')
    .addTag('Disputes')
    .addTag('Notifications')
    .addTag('Rates')
    .addTag('Admin')
    .addTag('Operator')
    .addTag('Health')
    .addTag('Proofs')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // Même préfixe que les routes REST : /api/v1/docs (évite de chercher /api/docs alors que l’API est sous /api/v1)
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    useGlobalPrefix: true,
  });

  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get(['/api/docs', '/api/docs/'], (_req: Request, res: Response) => {
    res.redirect(301, '/api/v1/docs');
  });

  const port = parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  const base = `http://127.0.0.1:${port}`;
  logger.log(`SwapTrust API ${base}/api/v1`);
  logger.log(`Swagger UI ${base}/api/v1/docs`);
  logger.log(`Health ${base}/api/v1/health`);
}
bootstrap();
