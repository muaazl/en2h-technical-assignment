import { Test, TestingModule } from '@nestjs/testing';
import { BookingService } from './booking.service';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';

describe('BookingService', () => {
  let service: BookingService;
  let prisma: PrismaService;

  const mockPrismaService = {
    service: {
      findUnique: jest.fn(),
    },
    booking: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BookingService>(BookingService);
    prisma = module.get<PrismaService>(PrismaService);

    // Clear all mock calls and implementations before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const serviceId = 'service-uuid';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    const createDto: CreateBookingDto = {
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      customerPhone: '+1234567890',
      serviceId,
      bookingDate: futureDate,
      bookingTime: '14:00',
      notes: 'No specific notes',
    };

    const mockServiceData = {
      id: serviceId,
      name: 'Initial Consultation',
      duration: 30,
      price: 50.0,
      description: 'Consultation service',
    };

    const checkDate = new Date(futureDate);
    checkDate.setHours(0, 0, 0, 0);

    it('should successfully create a booking', async () => {
      // Mock service exists
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      // Mock no duplicates
      mockPrismaService.booking.findFirst.mockResolvedValue(null);
      // Mock booking creation
      const mockCreatedBooking = {
        id: 'booking-uuid',
        ...createDto,
        bookingDate: checkDate,
        status: BookingStatus.PENDING,
        service: mockServiceData,
      };
      mockPrismaService.booking.create.mockResolvedValue(mockCreatedBooking);

      const result = await service.create(createDto);

      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: serviceId },
      });
      expect(mockPrismaService.booking.findFirst).toHaveBeenCalledWith({
        where: {
          serviceId,
          bookingDate: checkDate,
          bookingTime: createDto.bookingTime,
          status: {
            not: BookingStatus.CANCELLED,
          },
        },
      });
      expect(mockPrismaService.booking.create).toHaveBeenCalledWith({
        data: {
          customerName: createDto.customerName,
          customerEmail: createDto.customerEmail,
          customerPhone: createDto.customerPhone,
          serviceId,
          bookingDate: checkDate,
          bookingTime: createDto.bookingTime,
          notes: createDto.notes,
          status: BookingStatus.PENDING,
        },
        include: {
          service: true,
        },
      });
      expect(result).toEqual(mockCreatedBooking);
    });

    it('should fail to create a booking if the service does not exist', async () => {
      // Mock service does not exist
      mockPrismaService.service.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException(`Service with ID "${serviceId}" not found`),
      );

      expect(mockPrismaService.service.findUnique).toHaveBeenCalledWith({
        where: { id: serviceId },
      });
      expect(mockPrismaService.booking.create).not.toHaveBeenCalled();
    });

    it('should fail to create a booking with a past date', async () => {
      // Mock service exists
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);

      const pastDateDto: CreateBookingDto = {
        ...createDto,
        bookingDate: pastDate,
      };

      await expect(service.create(pastDateDto)).rejects.toThrow(
        new BadRequestException('Booking date cannot be in the past.'),
      );

      expect(mockPrismaService.booking.findFirst).not.toHaveBeenCalled();
      expect(mockPrismaService.booking.create).not.toHaveBeenCalled();
    });

    it('should fail to create a duplicate booking (should throw ConflictException)', async () => {
      // Mock service exists
      mockPrismaService.service.findUnique.mockResolvedValue(mockServiceData);
      // Mock duplicate exists
      const mockDuplicateBooking = {
        id: 'existing-booking-uuid',
        ...createDto,
        bookingDate: checkDate,
        status: BookingStatus.CONFIRMED,
      };
      mockPrismaService.booking.findFirst.mockResolvedValue(mockDuplicateBooking);

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException(
          'A booking already exists for this service at the selected date and time.',
        ),
      );

      expect(mockPrismaService.booking.findFirst).toHaveBeenCalled();
      expect(mockPrismaService.booking.create).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    const bookingId = 'booking-uuid';
    const mockServiceData = {
      id: 'service-uuid',
      name: 'Initial Consultation',
    };

    it('should successfully update status of a booking', async () => {
      const mockExistingBooking = {
        id: bookingId,
        status: BookingStatus.PENDING,
        service: mockServiceData,
      };
      const mockUpdatedBooking = {
        id: bookingId,
        status: BookingStatus.CONFIRMED,
        service: mockServiceData,
      };

      // Mock findOne / findUnique
      mockPrismaService.booking.findUnique.mockResolvedValue(mockExistingBooking);
      // Mock update
      mockPrismaService.booking.update.mockResolvedValue(mockUpdatedBooking);

      const result = await service.updateStatus(bookingId, {
        status: BookingStatus.CONFIRMED,
      });

      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: bookingId },
        include: { service: true },
      });
      expect(mockPrismaService.booking.update).toHaveBeenCalledWith({
        where: { id: bookingId },
        data: { status: BookingStatus.CONFIRMED },
        include: { service: true },
      });
      expect(result).toEqual(mockUpdatedBooking);
    });

    it('should fail to update a CANCELLED booking to COMPLETED', async () => {
      const mockCancelledBooking = {
        id: bookingId,
        status: BookingStatus.CANCELLED,
        service: mockServiceData,
      };

      // Mock findOne / findUnique to return a CANCELLED booking
      mockPrismaService.booking.findUnique.mockResolvedValue(mockCancelledBooking);

      await expect(
        service.updateStatus(bookingId, { status: BookingStatus.COMPLETED }),
      ).rejects.toThrow(
        new BadRequestException('Cannot update status of a CANCELLED booking to COMPLETED.'),
      );

      expect(mockPrismaService.booking.findUnique).toHaveBeenCalledWith({
        where: { id: bookingId },
        include: { service: true },
      });
      expect(mockPrismaService.booking.update).not.toHaveBeenCalled();
    });
  });
});
