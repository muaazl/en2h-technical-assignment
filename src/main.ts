import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global route prefix for REST endpoints, excluding the root
  app.setGlobalPrefix('api', { exclude: ['/'] });

  // Register global validation pipe with strict validation settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Register global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Booking Platform API')
    .setDescription('The Booking Platform API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
void bootstrap();

