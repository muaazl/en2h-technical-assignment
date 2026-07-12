import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Title of the service',
    example: 'Haircut & Styling',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Detailed description of the service',
    example: 'A premium haircut followed by professional washing and styling.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Duration of the service in minutes',
    example: 45,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  duration: number;

  @ApiProperty({
    description: 'Price of the service',
    example: 50.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({
    description: 'Indicates if the service is active and available for booking',
    default: true,
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isActive?: boolean;
}
