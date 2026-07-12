import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, user.email);
  }

  async refresh(dto: RefreshDto) {
    try {
      const rawPayload: unknown = await this.jwtService.verifyAsync(
        dto.refreshToken,
        {
          secret:
            process.env.JWT_REFRESH_SECRET ||
            'super-secret-refresh-key-should-be-changed',
        },
      );
      const payload = rawPayload as { sub: string; email: string };

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.hashedRefreshToken) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const isRefreshTokenValid = await bcrypt.compare(
        dto.refreshToken,
        user.hashedRefreshToken,
      );

      if (!isRefreshTokenValid) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      return this.generateTokens(user.id, user.email);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret:
            process.env.JWT_SECRET ||
            'super-secret-access-key-should-be-changed',
          expiresIn: (process.env.JWT_EXPIRATION as never) || '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret:
            process.env.JWT_REFRESH_SECRET ||
            'super-secret-refresh-key-should-be-changed',
          expiresIn: (process.env.JWT_REFRESH_EXPIRATION as never) || '7d',
        },
      ),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
      },
    };
  }
}
