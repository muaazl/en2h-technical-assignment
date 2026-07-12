import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { Type } from 'class-transformer';

// Custom class-validator to ensure a date is today or in the future
export function IsFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value) return false;
          const valAsDate =
            value instanceof Date ? value : new Date(value as string | number);
          if (isNaN(valAsDate.getTime())) return false;

          // Normalize today and the booking date to midnight local time for date comparison
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const bookingDate = new Date(valAsDate);
          bookingDate.setHours(0, 0, 0, 0);

          return bookingDate >= today;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be today or a future date.`;
        },
      },
    });
  };
}

export class CreateBookingDto {
  @ApiProperty({
    description: 'Name of the customer placing the booking',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    description: 'Email address of the customer',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({
    description: 'Phone number of the customer',
    example: '+1234567890',
  })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({
    description: 'The UUID of the service to book',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'The date of the booking (YYYY-MM-DD or ISO string)',
    example: '2026-07-15T00:00:00.000Z',
  })
  @Type(() => Date)
  @IsFutureDate()
  bookingDate: Date;

  @ApiProperty({
    description: 'The time slot for the booking (e.g. HH:MM or simple string)',
    example: '14:30',
  })
  @IsString()
  @IsNotEmpty()
  bookingTime: string;

  @ApiPropertyOptional({
    description: 'Additional notes for the booking',
    example: 'Please ring the bell upon arrival.',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
