import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: 'The updated status of the booking',
    example: BookingStatus.CONFIRMED,
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}
