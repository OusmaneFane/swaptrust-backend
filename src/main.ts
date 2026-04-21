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
    .setTitle('DoniSend API')
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

  // Protect Swagger UI with HTTP Basic Auth (optional if env not set)
  const swaggerUser = process.env.SWAGGER_USER ?? '';
  const swaggerPass = process.env.SWAGGER_PASSWORD ?? '';
  if (swaggerUser && swaggerPass) {
    expressApp.use(['/api/v1/docs', '/api/v1/docs/', '/api/docs', '/api/docs/'], (req: Request, res: Response, next: () => void) => {
      const header = req.headers.authorization ?? '';
      const [scheme, encoded] = header.split(' ');
      if (scheme !== 'Basic' || !encoded) {
        res.setHeader('WWW-Authenticate', 'Basic realm="DoniSend API Docs"');
        return res.status(401).send('Authentication required');
      }
      const decoded = Buffer.from(encoded, 'base64').toString('utf8');
      const idx = decoded.indexOf(':');
      const user = idx >= 0 ? decoded.slice(0, idx) : decoded;
      const pass = idx >= 0 ? decoded.slice(idx + 1) : '';
      if (user !== swaggerUser || pass !== swaggerPass) {
        res.setHeader('WWW-Authenticate', 'Basic realm="DoniSend API Docs"');
        return res.status(401).send('Invalid credentials');
      }
      return next();
    });
  } else {
    logger.warn('Swagger docs not protected: set SWAGGER_USER and SWAGGER_PASSWORD to enable Basic Auth');
  }

  expressApp.get(['/api/docs', '/api/docs/'], (_req: Request, res: Response) => {
    res.redirect(301, '/api/v1/docs');
  });

  const port = parseInt(process.env.PORT ?? '3001', 10);
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  const base = `http://127.0.0.1:${port}`;
  logger.log(`DoniSend API ${base}/api/v1`);
  logger.log(`Swagger UI ${base}/api/v1/docs`);
  logger.log(`Health ${base}/api/v1/health`);
}
bootstrap();
