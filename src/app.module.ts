import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ServiceModule } from './service/service.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [PrismaModule, AuthModule, ServiceModule, BookingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
