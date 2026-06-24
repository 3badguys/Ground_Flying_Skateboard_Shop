import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassRecordDto } from './dto/create-class-record.dto';
import { UpdateClassRecordDto } from './dto/update-class-record.dto';
import { computeClassFees } from '../../common/fee-calculator';
import { Role } from '../auth/roles';

@Injectable()
export class ClassRecordService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStudentId(
    studentId: number,
    user?: { id: number; role: Role; phone: string | null },
  ) {
    // USER can only see records for students matching their phone
    if (user?.role === Role.USER && user.phone) {
      const student = await this.prisma.student.findUnique({ where: { id: studentId } });
      if (!student || student.phone !== user.phone) {
        throw new ForbiddenException('Not allowed');
      }
    }
    const [records, courses] = await Promise.all([
      this.prisma.classRecord.findMany({
        where: { studentId },
        orderBy: { classDate: 'desc' },
      }),
      this.prisma.courseInfo.findMany({
        where: { studentId },
        orderBy: { enrollmentDate: 'asc' },
      }),
    ]);

    const feeMap = computeClassFees(
      courses.map((c) => ({ id: c.id, hours: c.hours, tuition: c.tuition, enrollmentDate: c.enrollmentDate })),
      records.map((r) => ({ id: r.id, hours: r.hours, classDate: r.classDate })),
    );

    return records.map((r) => ({
      ...r,
      classFee: feeMap.get(r.id) ?? 0,
    }));
  }

  async create(studentId: number, dto: CreateClassRecordDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('学生不存在');

    const [courseAgg, recordAgg] = await Promise.all([
      this.prisma.courseInfo.aggregate({
        where: { studentId },
        _sum: { hours: true },
      }),
      this.prisma.classRecord.aggregate({
        where: { studentId },
        _sum: { hours: true },
      }),
    ]);
    const remaining = (courseAgg._sum.hours ?? 0) - (recordAgg._sum.hours ?? 0);
    if (dto.hours > remaining) {
      throw new BadRequestException(`课时不能超过剩余课时(${remaining})`);
    }

    // 检查同一学员同一天同一时段是否已有记录
    if (dto.startTime || dto.endTime) {
      const duplicate = await this.prisma.classRecord.findFirst({
        where: {
          studentId,
          classDate: new Date(dto.classDate),
          startTime: dto.startTime || null,
        },
      });
      if (duplicate) {
        throw new BadRequestException(
          '该学员在当天该时段已有上课记录',
        );
      }
    }

    return this.prisma.classRecord.create({
      data: {
        studentId,
        classDate: new Date(dto.classDate),
        hours: dto.hours,
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
      },
    });
  }

  async update(id: number, dto: UpdateClassRecordDto) {
    const existing = await this.prisma.classRecord.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('上课记录不存在');

    if (dto.hours !== undefined) {
      const [courseAgg, recordAgg] = await Promise.all([
        this.prisma.courseInfo.aggregate({
          where: { studentId: existing.studentId },
          _sum: { hours: true },
        }),
        this.prisma.classRecord.aggregate({
          where: { studentId: existing.studentId },
          _sum: { hours: true },
        }),
      ]);
      const totalHours = courseAgg._sum.hours ?? 0;
      const usedHours = recordAgg._sum.hours ?? 0;
      const newUsedHours = usedHours - existing.hours + dto.hours;
      if (newUsedHours > totalHours) {
        throw new BadRequestException(`课时修改后已用课时(${newUsedHours})不能大于总课时(${totalHours})`);
      }
    }

    // 检查同一学员同一天同一时段是否已有记录（排除自身）
    if (dto.startTime !== undefined || dto.classDate !== undefined) {
      const checkDate = dto.classDate ? new Date(dto.classDate) : existing.classDate;
      const checkTime = dto.startTime !== undefined ? dto.startTime : existing.startTime;
      if (checkTime) {
        const duplicate = await this.prisma.classRecord.findFirst({
          where: {
            studentId: existing.studentId,
            classDate: checkDate,
            startTime: checkTime,
            id: { not: id },
          },
        });
        if (duplicate) {
          throw new BadRequestException(
            '该学员在当天该时段已有上课记录',
          );
        }
      }
    }

    const data: any = { ...dto };
    if (dto.classDate) {
      data.classDate = new Date(dto.classDate);
    }

    return this.prisma.classRecord.update({ where: { id }, data });
  }

  async remove(id: number) {
    const existing = await this.prisma.classRecord.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('上课记录不存在');

    return this.prisma.classRecord.delete({ where: { id } });
  }

  async calendar(month: string, user?: { id: number; role: Role; phone: string | null }) {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 1);

    const where: any = { classDate: { gte: start, lt: end } };

    // USER only sees records for students matching their phone
    if (user?.role === Role.USER && user.phone) {
      where.student = { phone: user.phone };
    }

    const records = await this.prisma.classRecord.findMany({
      where,
      include: {
        student: { select: { name: true } },
      },
      orderBy: [{ classDate: 'asc' }, { startTime: 'asc' }],
    });

    // Compute fees per student
    const studentIds = [...new Set(records.map((r) => r.studentId))];
    const allCourses = await this.prisma.courseInfo.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { enrollmentDate: 'asc' },
    });
    const coursesByStudent = new Map<number, any[]>();
    for (const c of allCourses) {
      if (!coursesByStudent.has(c.studentId)) coursesByStudent.set(c.studentId, []);
      coursesByStudent.get(c.studentId)!.push(c);
    }
    const recordsByStudent = new Map<number, any[]>();
    for (const r of records) {
      if (!recordsByStudent.has(r.studentId)) recordsByStudent.set(r.studentId, []);
      recordsByStudent.get(r.studentId)!.push(r);
    }
    const feeMapByStudent = new Map<number, Map<number, number>>();
    for (const [sid, sr] of recordsByStudent) {
      const sc = coursesByStudent.get(sid) || [];
      feeMapByStudent.set(
        sid,
        computeClassFees(
          sc.map((c) => ({ id: c.id, hours: c.hours, tuition: c.tuition, enrollmentDate: c.enrollmentDate })),
          sr.map((x) => ({ id: x.id, hours: x.hours, classDate: x.classDate })),
        ),
      );
    }

    // Group by date
    const grouped: Record<string, any[]> = {};
    for (const r of records) {
      const key = r.classDate.toISOString().slice(0, 10);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        id: r.id,
        classDate: key,
        studentName: r.student.name,
        hours: r.hours,
        studentId: r.studentId,
        startTime: r.startTime,
        endTime: r.endTime,
        classFee: feeMapByStudent.get(r.studentId)?.get(r.id) ?? 0,
      });
    }

    return grouped;
  }
}
