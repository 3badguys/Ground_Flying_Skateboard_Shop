import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingDto } from './dto/booking.dto';

@Injectable()
export class BookingService {
  constructor(private readonly prisma: PrismaService) {}

  async getEligibleStudents() {
    const students = await this.prisma.student.findMany({
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

  async book(dto: BookingDto) {
    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.findUnique({
        where: { id: dto.studentId },
      });
      if (!student) throw new NotFoundException('学生不存在');

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
