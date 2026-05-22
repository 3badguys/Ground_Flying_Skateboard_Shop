import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { computeClassFees } from '../../common/fee-calculator';
const VALID_GENDERS: string[] = ['男', '女'];
const VALID_GRADES: string[] = [
  '幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三', '其他',
];

@Injectable()
export class StudentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: {
    page: number;
    pageSize: number;
    keyword?: string;
    grade?: string;
    gender?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const { page, pageSize, keyword, grade, gender, sortBy, sortOrder } = query;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { parentName: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }
    if (grade) {
      where.grade = grade;
    }
    if (gender) {
      where.gender = gender;
    }

    const isDirectSort = sortBy === 'enrollmentDate';
    const needsGlobalSort = sortBy && !isDirectSort;

    let students: any[];
    let total: number;

    if (needsGlobalSort || isDirectSort) {
      const orderBy: any = isDirectSort
        ? { enrollmentDate: sortOrder || 'asc' }
        : { createdAt: 'desc' };

      let allStudents = await this.prisma.student.findMany({
        where,
        orderBy,
      });
      total = allStudents.length;

      allStudents = await this.enrichWithTuition(allStudents);

      if (needsGlobalSort) {
        const dir = sortOrder === 'desc' ? -1 : 1;
        allStudents.sort((a, b) => (a[sortBy!] - b[sortBy!]) * dir);
      }

      const start = (page - 1) * pageSize;
      students = allStudents.slice(start, start + pageSize);
    } else {
      const [paged, count] = await Promise.all([
        this.prisma.student.findMany({
          where,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.student.count({ where }),
      ]);
      total = count;

      const studentIds = paged.map((s) => s.id);

      const [courseAggs, recordAggs] = await Promise.all([
        this.prisma.courseInfo.groupBy({
          by: ['studentId'],
          where: { studentId: { in: studentIds } },
          _sum: { hours: true },
        }),
        this.prisma.classRecord.groupBy({
          by: ['studentId'],
          where: { studentId: { in: studentIds } },
          _sum: { hours: true },
        }),
      ]);

      const totalMap = new Map(courseAggs.map((a) => [a.studentId, a._sum.hours ?? 0]));
      const usedMap = new Map(recordAggs.map((a) => [a.studentId, a._sum.hours ?? 0]));

      students = paged.map((s) => {
        const totalHours = totalMap.get(s.id) ?? 0;
        const usedHours = usedMap.get(s.id) ?? 0;
        return { ...s, totalHours, usedHours, remainingHours: Number(totalHours) - Number(usedHours) };
      });
    }

    const listWithFees = await this.enrichWithTuition(students);
    return { list: listWithFees, total, page, pageSize };
  }

  private async enrichWithTuition(slist: any[]) {
    if (slist.length === 0) return slist;
    const ids = slist.map((s) => s.id);

    const [courses, records] = await Promise.all([
      this.prisma.courseInfo.findMany({
        where: { studentId: { in: ids } },
        orderBy: { enrollmentDate: 'asc' },
      }),
      this.prisma.classRecord.findMany({
        where: { studentId: { in: ids } },
        orderBy: { classDate: 'asc' },
      }),
    ]);

    // Group courses and records by student
    const coursesByStudent = new Map<number, any[]>();
    const recordsByStudent = new Map<number, any[]>();
    for (const c of courses) {
      if (!coursesByStudent.has(c.studentId)) coursesByStudent.set(c.studentId, []);
      coursesByStudent.get(c.studentId)!.push(c);
    }
    for (const r of records) {
      if (!recordsByStudent.has(r.studentId)) recordsByStudent.set(r.studentId, []);
      recordsByStudent.get(r.studentId)!.push(r);
    }

    return slist.map((s) => {
      const sc = coursesByStudent.get(s.id) || [];
      const sr = recordsByStudent.get(s.id) || [];

      const totalHours = sc.reduce((a, c) => a + c.hours, 0);
      const usedHours = sr.reduce((a, r) => a + r.hours, 0);
      const totalTuition = Math.round(sc.reduce((a, c) => a + c.tuition, 0) * 100) / 100;

      let completedTuition = 0;
      if (sc.length > 0 && sr.length > 0) {
        const feeMap = computeClassFees(
          sc.map((c) => ({ id: c.id, hours: c.hours, tuition: c.tuition, enrollmentDate: c.enrollmentDate })),
          sr.map((r) => ({ id: r.id, hours: r.hours, classDate: r.classDate })),
        );
        completedTuition = Math.round(Array.from(feeMap.values()).reduce((a, v) => a + v, 0) * 100) / 100;
      }

      return {
        ...s,
        totalHours,
        usedHours,
        remainingHours: totalHours - usedHours,
        totalTuition,
        completedTuition,
      };
    });
  }

  async findOne(id: number) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        courseInfos: { orderBy: { enrollmentDate: 'desc' } },
        classRecords: { orderBy: { classDate: 'desc' } },
      },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const [totalAgg, usedAgg, tuitionAgg] = await Promise.all([
      this.prisma.courseInfo.aggregate({
        where: { studentId: id },
        _sum: { hours: true },
      }),
      this.prisma.classRecord.aggregate({
        where: { studentId: id },
        _sum: { hours: true },
      }),
      this.prisma.courseInfo.aggregate({
        where: { studentId: id },
        _sum: { tuition: true },
      }),
    ]);

    const totalHours = totalAgg._sum.hours ?? 0;
    const usedHours = usedAgg._sum.hours ?? 0;
    const totalTuition = tuitionAgg._sum.tuition ?? 0;

    // Add unitPrice to each course
    const enrichedCourses = student.courseInfos.map((c) => ({
      ...c,
      unitPrice: c.hours > 0 ? Math.round((c.tuition / c.hours) * 100) / 100 : 0,
    }));

    // Compute class fees via FIFO
    const feeMap = computeClassFees(
      student.courseInfos.map((c) => ({ id: c.id, hours: c.hours, tuition: c.tuition, enrollmentDate: c.enrollmentDate })),
      student.classRecords.map((r) => ({ id: r.id, hours: r.hours, classDate: r.classDate })),
    );

    const enrichedRecords = student.classRecords.map((r) => ({
      ...r,
      classFee: feeMap.get(r.id) ?? 0,
    }));

    const completedTuition = Array.from(feeMap.values()).reduce((s, v) => s + v, 0);

    return {
      ...student,
      courseInfos: enrichedCourses,
      classRecords: enrichedRecords,
      totalHours,
      usedHours,
      remainingHours: Number(totalHours) - Number(usedHours),
      totalTuition: Math.round(totalTuition * 100) / 100,
      completedTuition: Math.round(completedTuition * 100) / 100,
    };
  }

  async create(dto: CreateStudentDto) {
    if (!VALID_GENDERS.includes(dto.gender)) {
      throw new BadRequestException('性别只能是男或女');
    }
    if (!VALID_GRADES.includes(dto.grade)) {
      throw new BadRequestException('无效的年级');
    }

    return this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          name: dto.name,
          parentName: dto.parentName,
          gender: dto.gender,
          grade: dto.grade,
          phone: dto.phone,
          enrollmentDate: new Date(dto.enrollmentDate),
        },
      });

      if (dto.hours && dto.hours > 0) {
        await tx.courseInfo.create({
          data: {
            studentId: student.id,
            hours: dto.hours,
            tuition: dto.tuition ?? 0,
            enrollmentDate: new Date(dto.enrollmentDate),
          },
        });
      }

      return student;
    });
  }

  async update(id: number, dto: UpdateStudentDto) {
    await this.findOne(id);
    if (dto.gender && !VALID_GENDERS.includes(dto.gender)) {
      throw new BadRequestException('性别只能是男或女');
    }
    if (dto.grade && !VALID_GRADES.includes(dto.grade)) {
      throw new BadRequestException('无效的年级');
    }

    const data: any = { ...dto };
    delete data.hours;
    delete data.tuition;
    if (dto.enrollmentDate) {
      data.enrollmentDate = new Date(dto.enrollmentDate);
    } else {
      delete data.enrollmentDate;
    }

    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.student.delete({ where: { id } });
  }
}
