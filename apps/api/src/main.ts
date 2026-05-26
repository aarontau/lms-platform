import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
  }))

  // CORS
  app.enableCors({
    origin: process.env.APP_URL || 'http://localhost:3000',
    credentials: true,
  })

  // Swagger API docs
  const config = new DocumentBuilder()
    .setTitle('EduTrack LMS API')
    .setDescription('South African Multi-School Learner Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api', app, document)

  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`EduTrack API running on http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api`)
}

bootstrap()
