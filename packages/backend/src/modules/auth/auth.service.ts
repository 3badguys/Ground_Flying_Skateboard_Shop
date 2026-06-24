import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, ROLE_HIERARCHY } from './roles';
import { JwtPayload, UserInfo, LoginResponse } from './types';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─── public helpers ──────────────────────────────────────────────

  /** Map DB user row to safe UserInfo (no password) */
  mapUserInfo(user: {
    id: number;
    username: string | null;
    phone: string | null;
    role: string;
    mustResetPassword: boolean;
    createdAt: Date;
  }): UserInfo {
    return {
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role as Role,
      mustResetPassword: user.mustResetPassword,
      createdAt: user.createdAt,
    };
  }

  // ─── login / refresh / logout ────────────────────────────────────

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: dto.username
        ? { username: dto.username }
        : { phone: dto.phone },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid username/phone or password');
    }

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid username/phone or password');
    }

    const { accessToken, refreshToken } = await this.generateTokens({
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role as Role,
    });

    return {
      accessToken,
      refreshToken,
      user: this.mapUserInfo(user),
    };
  }

  async refresh(refreshTokenStr: string): Promise<{ accessToken: string }> {
    // Verify the refresh token exists in the database
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
      include: { user: true },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (new Date() > stored.expiresAt) {
      await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token has expired');
    }

    const payload: JwtPayload = {
      sub: stored.user.id,
      username: stored.user.username,
      phone: stored.user.phone,
      role: stored.user.role as Role,
    };

    const accessSecret = this.configService.get<string>('ACCESS_SECRET') ?? 'dev-secret';
    const accessExpires = this.configService.get<string>('ACCESS_EXPIRES') ?? '15m';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpires as any,
    });

    return { accessToken };
  }

  async logout(refreshTokenStr: string): Promise<void> {
    try {
      await this.prisma.refreshToken.delete({ where: { token: refreshTokenStr } });
    } catch {
      // Token already deleted — no-op
    }
  }

  // ─── profile ─────────────────────────────────────────────────────

  async getProfile(userId: number): Promise<UserInfo> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.mapUserInfo(user);
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserInfo> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    // SUPER_ADMIN cannot change username or password
    if (user.role === Role.SUPER_ADMIN) {
      if (dto.username !== undefined || dto.password !== undefined) {
        throw new ForbiddenException('Super admin cannot change username or password');
      }
    }

    const data: Record<string, unknown> = {};

    if (dto.username !== undefined) data.username = dto.username;
    if (dto.phone !== undefined) data.phone = dto.phone;

    if (dto.password) {
      data.password = await this.hashPassword(dto.password);
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }

    // Check uniqueness before update
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Username already taken');
      }
    }
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Phone already taken');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return this.mapUserInfo(updated);
  }

  async getMyStudents(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.role !== Role.USER) {
      throw new ForbiddenException('Only student users can view linked students');
    }

    if (!user.phone) return [];

    const students = await this.prisma.student.findMany({
      where: { phone: user.phone },
      include: { courseInfos: true, classRecords: true },
      orderBy: { name: 'asc' },
    });

    return students.map((s) => {
      const totalHours = s.courseInfos.reduce((sum, c) => sum + c.hours, 0);
      const usedHours = s.classRecords.reduce((sum, r) => sum + r.hours, 0);
      return {
        id: s.id,
        name: s.name,
        grade: s.grade,
        gender: s.gender,
        phone: s.phone,
        parentName: s.parentName,
        enrollmentDate: s.enrollmentDate,
        totalHours,
        usedHours,
        remainingHours: totalHours - usedHours,
      };
    });
  }

  // ─── user management (admin) ─────────────────────────────────────

  async listUsers(requesterId: number): Promise<UserInfo[]> {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: requesterId },
    });

    const where: Record<string, unknown> = {};

    if (requester.role !== Role.SUPER_ADMIN) {
      // Non-SUPER_ADMIN cannot see SUPER_ADMIN accounts
      where.role = { not: Role.SUPER_ADMIN };
    }

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((u) => this.mapUserInfo(u));
  }

  async createUser(creatorId: number, dto: CreateUserDto): Promise<UserInfo> {
    const creator = await this.prisma.user.findUniqueOrThrow({
      where: { id: creatorId },
    });

    const targetRole = dto.role as Role;
    const allowedRoles = ROLE_HIERARCHY[creator.role as Role];

    if (!allowedRoles.includes(targetRole)) {
      throw new ForbiddenException('Not allowed to create users of this role');
    }

    // Validate required fields per role
    if (targetRole !== Role.USER && !dto.username) {
      throw new ForbiddenException('Username is required for ADMIN accounts');
    }
    if (targetRole === Role.USER && !dto.phone) {
      throw new ForbiddenException('Phone is required for USER accounts');
    }

    // Check uniqueness
    if (dto.username) {
      const existing = await this.prisma.user.findUnique({
        where: { username: dto.username },
      });
      if (existing) throw new ConflictException('Username already taken');
    }
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing) throw new ConflictException('Phone already taken');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username ?? null,
        phone: dto.phone ?? null,
        password: hashedPassword,
        role: targetRole,
      },
    });

    return this.mapUserInfo(user);
  }

  async updateUser(
    requesterId: number,
    targetId: number,
    dto: UpdateUserDto,
  ): Promise<UserInfo> {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: requesterId },
    });
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id: targetId },
    });

    // SUPER_ADMIN can update anyone; ADMIN can update USER accounts only
    if (requester.role !== Role.SUPER_ADMIN && target.role !== Role.USER) {
      throw new ForbiddenException('Cannot update this user');
    }

    // Cannot change role to one you're not allowed to manage
    if (dto.role) {
      const allowedRoles = ROLE_HIERARCHY[requester.role as Role];
      if (!allowedRoles.includes(dto.role as Role)) {
        throw new ForbiddenException('Cannot set this role');
      }
    }

    // SUPER_ADMIN's username/password cannot be changed
    if (target.role === Role.SUPER_ADMIN) {
      if (dto.username !== undefined || dto.password !== undefined) {
        throw new ForbiddenException('Cannot change super admin username or password');
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.username !== undefined) data.username = dto.username || null;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password) {
      data.password = await this.hashPassword(dto.password);
      await this.prisma.refreshToken.deleteMany({ where: { userId: targetId } });
    }

    const user = await this.prisma.user.update({
      where: { id: targetId },
      data,
    });

    return this.mapUserInfo(user);
  }

  async deleteUser(requesterId: number, targetId: number): Promise<void> {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: requesterId },
    });
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id: targetId },
    });

    // Cannot delete SUPER_ADMIN
    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Cannot delete SUPER_ADMIN');
    }

    // SUPER_ADMIN can delete anyone (except SUPER_ADMIN), ADMIN can delete USER only
    if (requester.role !== Role.SUPER_ADMIN && target.role !== Role.USER) {
      throw new ForbiddenException('Cannot delete this user');
    }

    await this.prisma.user.delete({ where: { id: targetId } });
  }

  async getUserPassword(
    requesterId: number,
    targetId: number,
  ): Promise<{ password: string }> {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: requesterId },
    });
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id: targetId },
    });

    // SUPER_ADMIN can see anyone's password
    if (requester.role === Role.SUPER_ADMIN) {
      return { password: target.password };
    }

    // ADMIN can only see USER passwords
    if (
      requester.role === Role.ADMIN &&
      target.role === Role.USER
    ) {
      return { password: target.password };
    }

    throw new ForbiddenException('Cannot view this password');
  }

  async getUserStudents(requesterId: number, targetId: number) {
    const requester = await this.prisma.user.findUniqueOrThrow({
      where: { id: requesterId },
    });
    const target = await this.prisma.user.findUniqueOrThrow({
      where: { id: targetId },
    });

    // Only SUPER_ADMIN and ADMIN can view, and only for USER accounts
    if (requester.role === Role.USER) {
      throw new ForbiddenException('Not allowed');
    }

    if (target.role !== Role.USER) {
      return [];
    }

    if (!target.phone) return [];

    return this.prisma.student.findMany({
      where: { phone: target.phone },
      orderBy: { name: 'asc' },
    });
  }

  // ─── private ─────────────────────────────────────────────────────

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  private async generateTokens(user: {
    id: number;
    username: string | null;
    phone: string | null;
    role: Role;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role,
    };

    const accessSecret = this.configService.get<string>('ACCESS_SECRET') ?? 'dev-secret';
    const accessExpires = this.configService.get<string>('ACCESS_EXPIRES') ?? '15m';
    const refreshSecret = this.configService.get<string>('REFRESH_SECRET') ?? 'dev-refresh-secret';
    const refreshExpires = this.configService.get<string>('REFRESH_EXPIRES') ?? '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpires as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpires as any,
    });

    const expiresInMs = this.parseDuration(
      this.configService.get<string>('REFRESH_EXPIRES', '7d'),
    );
    const expiresAt = new Date(Date.now() + expiresInMs);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private parseDuration(dur: string): number {
    const match = dur.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7d
    const num = parseInt(match[1], 10);
    switch (match[2]) {
      case 's': return num * 1000;
      case 'm': return num * 60 * 1000;
      case 'h': return num * 3600 * 1000;
      case 'd': return num * 86400 * 1000;
      default:  return 7 * 86400 * 1000;
    }
  }
}
