import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // API Versioning (URI /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — allow wildcard subdomains in dev (*.lvh.me)
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (
        !origin ||
        origin.endsWith('.lvh.me:3000') ||
        origin === 'http://lvh.me:3000' ||
        origin === 'http://localhost:3000' ||
        origin.includes('127.0.0.1')
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Dev mode default
      }
    },
    credentials: true,
  });

  // Swagger Documentation Setup
  const config = new DocumentBuilder()
    .setTitle('Assos 2.0 API')
    .setDescription('Backend API pour la gestion associative, tontines et mutuelles')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.API_PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 API Assos 2.0 en cours d'exécution sur http://127.0.0.1:${port}/api/v1`);
  console.log(`📚 Documentation Swagger sur http://127.0.0.1:${port}/api/docs`);
}

bootstrap();
