import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingDto } from './dto/booking.dto';
import { Role } from '../auth/roles';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async getEligibleStudents(user: { id: number; role: Role; phone: string | null }) {
    const where: Record<string, unknown> = {};

    // USER role only sees students matching their phone
    if (user.role === Role.USER && user.phone) {
      where.phone = user.phone;
    }

    const students = await this.prisma.student.findMany({
      where,
      include: {
        courseInfos: true,
        classRecords: true,
      },
    });

    const eligible = students
      .map((s) => {
        const totalHours = s.courseInfos.reduce(
          (sum, c) => sum + c.hours,
          0,
        );
        const usedHours = s.classRecords.reduce(
          (sum, r) => sum + r.hours,
          0,
        );
        const remainingHours = totalHours - usedHours;
        return {
          id: s.id,
          name: s.name,
          parentName: s.parentName,
          remainingHours,
        };
      })
      .filter((s) => s.remainingHours > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    return eligible;
  }

  async book(dto: BookingDto, user?: { id: number; role: Role; phone: string | null }) {
    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: dto.studentId },
      });
      if (!student) throw new NotFoundException('学生不存在');

      // USER can only book for students matching their phone
      if (user?.role === Role.USER && user.phone && student.phone !== user.phone) {
        throw new ForbiddenException('只能为自己的学生预约');
      }

      const [courseAgg, recordAgg] = await Promise.all([
        tx.courseInfo.aggregate({
          where: { studentId: dto.studentId },
          _sum: { hours: true },
        }),
        tx.classRecord.aggregate({
          where: { studentId: dto.studentId },
          _sum: { hours: true },
        }),
      ]);

      const remaining =
        (courseAgg._sum.hours ?? 0) - (recordAgg._sum.hours ?? 0);

      if (remaining <= 0) {
        throw new BadRequestException('该学生没有剩余课时');
      }
      if (dto.hours > remaining) {
        throw new BadRequestException(
          `课时不能超过剩余课时(${remaining})`,
        );
      }

      // 检查同一学员同一天同一时段是否已有记录
      if (dto.startTime || dto.endTime) {
        const duplicate = await tx.classRecord.findFirst({
          where: {
            studentId: dto.studentId,
            classDate: new Date(dto.classDate),
            startTime: dto.startTime || null,
          },
        });
        if (duplicate) {
          throw new BadRequestException(
            '该学员在当天该时段已有上课记录，请勿重复预约',
          );
        }
      }

      return tx.classRecord.create({
        data: {
          studentId: dto.studentId,
          classDate: new Date(dto.classDate),
          hours: dto.hours,
          startTime: dto.startTime || null,
          endTime: dto.endTime || null,
        },
      });
    });
  }
}
