import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseInfoDto } from './dto/create-course-info.dto';
import { UpdateCourseInfoDto } from './dto/update-course-info.dto';

@Injectable()
export class CourseInfoService {
  constructor(private readonly prisma: PrismaService) {}

  async findByStudentId(studentId: number) {
    const courses = await this.prisma.courseInfo.findMany({
      where: { studentId },
      orderBy: { enrollmentDate: 'desc' },
    });
    return courses.map((c) => ({
      ...c,
      unitPrice: c.hours > 0 ? Math.round((c.tuition / c.hours) * 100) / 100 : 0,
    }));
  }

  async create(studentId: number, dto: CreateCourseInfoDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('学生不存在');

    return this.prisma.courseInfo.create({
      data: {
        studentId,
        hours: dto.hours,
        tuition: dto.tuition,
        enrollmentDate: new Date(dto.enrollmentDate),
      },
    });
  }

  async update(id: number, dto: UpdateCourseInfoDto) {
    const existing = await this.prisma.courseInfo.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('课程信息不存在');

    const data: any = { ...dto };
    if (dto.enrollmentDate) {
      data.enrollmentDate = new Date(dto.enrollmentDate);
    }

    return this.prisma.courseInfo.update({ where: { id }, data });
  }

  async remove(id: number) {
    const existing = await this.prisma.courseInfo.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('课程信息不存在');

    return this.prisma.courseInfo.delete({ where: { id } });
  }
}
