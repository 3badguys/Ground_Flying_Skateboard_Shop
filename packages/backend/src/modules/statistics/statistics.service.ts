import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { computeClassFees } from '../../common/fee-calculator';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Monthly income trend
  async monthlyIncome(year: number) {
    const records = await this.prisma.classRecord.findMany({
      where: {
        classDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
      orderBy: { classDate: 'asc' },
    });
    const studentIds = [...new Set(records.map((r) => r.studentId))];
    const courses = await this.prisma.courseInfo.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { enrollmentDate: 'asc' },
    });

    const coursesByStudent = new Map<number, typeof courses>();
    for (const c of courses) {
      if (!coursesByStudent.has(c.studentId)) coursesByStudent.set(c.studentId, []);
      coursesByStudent.get(c.studentId)!.push(c);
    }
    const recordsByStudent = new Map<number, typeof records>();
    for (const r of records) {
      if (!recordsByStudent.has(r.studentId)) recordsByStudent.set(r.studentId, []);
      recordsByStudent.get(r.studentId)!.push(r);
    }
    // Compute all fees per student
    const feeMap = new Map<number, number>();
    for (const [sid, crs] of recordsByStudent) {
      const sc = coursesByStudent.get(sid) || [];
      const f = computeClassFees(
        sc.map((c) => ({ id: c.id, hours: c.hours, tuition: c.tuition, enrollmentDate: c.enrollmentDate })),
        crs.map((r) => ({ id: r.id, hours: r.hours, classDate: r.classDate })),
      );
      for (const [rid, fee] of f) feeMap.set(rid, fee);
    }

    // Monthly enrollment income (from courseInfo)
    const allCourses = await this.prisma.courseInfo.findMany({
      orderBy: { enrollmentDate: 'asc' },
    });

    const monthly: { month: string; income: number; completed: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);

      const monthRecords = records.filter((r) => r.classDate >= start && r.classDate < end);
      const income = allCourses
        .filter((c) => c.enrollmentDate >= start && c.enrollmentDate < end)
        .reduce((s, c) => s + c.tuition, 0);
      const completed = monthRecords.reduce((s, r) => s + (feeMap.get(r.id) ?? 0), 0);

      monthly.push({
        month: `${m + 1}月`,
        income: Math.round(income * 100) / 100,
        completed: Math.round(completed * 100) / 100,
      });
    }

    return monthly;
  }

  // 2. Student grade distribution
  async gradeDistribution() {
    const students = await this.prisma.student.findMany();
    const map: Record<string, number> = {};
    for (const s of students) {
      map[s.grade] = (map[s.grade] || 0) + 1;
    }
    return Object.entries(map).map(([grade, count]) => ({ grade, count }));
  }

  // 3. Monthly hours (enrolled + completed)
  async monthlyHours(year: number) {
    const records = await this.prisma.classRecord.findMany({
      where: {
        classDate: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const courses = await this.prisma.courseInfo.findMany();

    const monthly: { month: string; enrolled: number; completed: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);

      const enrolled = courses
        .filter((c) => c.enrollmentDate >= start && c.enrollmentDate < end)
        .reduce((s, c) => s + c.hours, 0);
      const completed = records
        .filter((r) => r.classDate >= start && r.classDate < end)
        .reduce((s, r) => s + r.hours, 0);

      monthly.push({ month: `${m + 1}月`, enrolled, completed });
    }

    return monthly;
  }

  // 5. Monthly enrollment (new + continuing students)
  async monthlyEnrollment(year: number) {
    const students = await this.prisma.student.findMany();
    const courses = await this.prisma.courseInfo.findMany({ include: { student: true } });

    const monthly: { month: string; newStudents: number; continuing: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 1);

      const newStudents = students.filter((s) => s.enrollmentDate >= start && s.enrollmentDate < end).length;

      const monthCourses = courses.filter((c) => c.enrollmentDate >= start && c.enrollmentDate < end);
      const continuingSet = new Set<number>();
      for (const c of monthCourses) {
        // Count as continuing if this is NOT the student's first course
        const studentFirstCourseDate = courses
          .filter((x) => x.studentId === c.studentId)
          .reduce((min, x) => (x.enrollmentDate < min ? x.enrollmentDate : min), new Date('2099-01-01'));
        if (c.enrollmentDate > studentFirstCourseDate) {
          continuingSet.add(c.studentId);
        }
      }
      monthly.push({ month: `${m + 1}月`, newStudents, continuing: continuingSet.size });
    }
    return monthly;
  }

  // 4. Student rankings
  async studentRankings(type: string) {
    const students = await this.prisma.student.findMany({
      include: { courseInfos: true, classRecords: true },
    });

    const ranking = students.map((s) => {
      const total = s.courseInfos.reduce((a, c) => a + c.hours, 0);
      const used = s.classRecords.reduce((a, r) => a + r.hours, 0);
      return {
        name: s.name,
        totalHours: total,
        usedHours: used,
        remaining: total - used,
      };
    });

    if (type === 'remaining') {
      ranking.sort((a, b) => b.remaining - a.remaining);
    } else {
      ranking.sort((a, b) => b.usedHours - a.usedHours);
    }

    return ranking.slice(0, 10);
  }
}
