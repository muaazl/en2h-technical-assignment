import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    return this.prisma.service.create({
      data: {
        title: createServiceDto.title,
        description: createServiceDto.description ?? '',
        duration: createServiceDto.duration,
        price: createServiceDto.price,
        isActive: createServiceDto.isActive ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.service.findMany();
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${id}" not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    // Ensure service exists before trying to update
    await this.findOne(id);

    return this.prisma.service.update({
      where: { id },
      data: updateServiceDto,
    });
  }

  async remove(id: string) {
    // Ensure service exists before trying to delete
    await this.findOne(id);

    return this.prisma.service.delete({
      where: { id },
    });
  }
}
