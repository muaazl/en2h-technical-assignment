import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const {
      serviceId,
      bookingDate,
      bookingTime,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = createBookingDto;

    // 1. Service Verification: Ensure the service exists
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID "${serviceId}" not found`);
    }

    // Double safeguard check for Past Dates at service level
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(bookingDate);
    checkDate.setHours(0, 0, 0, 0);

    if (checkDate < today) {
      throw new BadRequestException('Booking date cannot be in the past.');
    }

    // 2. Prevent Duplicate Bookings (Check non-cancelled bookings for same service, date, and time)
    const duplicate = await this.prisma.booking.findFirst({
      where: {
        serviceId,
        bookingDate: checkDate,
        bookingTime,
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    });

    if (duplicate) {
      throw new ConflictException(
        'A booking already exists for this service at the selected date and time.',
      );
    }

    // Create the booking
    return this.prisma.booking.create({
      data: {
        customerName,
        customerEmail,
        customerPhone,
        serviceId,
        bookingDate: checkDate,
        bookingTime,
        notes,
        status: BookingStatus.PENDING,
      },
      include: {
        service: true,
      },
    });
  }

  async findAll(query: GetBookingsQueryDto) {
    const { page, limit, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BookingWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, bookings] = await Promise.all([
      this.prisma.booking.count({ where }),
      this.prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
        },
      }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        service: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }

    return booking;
  }

  async updateStatus(
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    const { status } = updateBookingStatusDto;
    const booking = await this.findOne(id);

    // Status Transition Rule: CANCELLED cannot be updated to COMPLETED
    if (
      booking.status === BookingStatus.CANCELLED &&
      status === BookingStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Cannot update status of a CANCELLED booking to COMPLETED.',
      );
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        service: true,
      },
    });
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (booking.status === BookingStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a COMPLETED booking.');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED },
      include: {
        service: true,
      },
    });
  }

  async remove(id: string) {
    // Ensure the booking exists first
    await this.findOne(id);

    return this.prisma.booking.delete({
      where: { id },
    });
  }
}
