import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── 随机数据池 ──────────────────────────────────────────────

const LAST_NAMES = [
  '王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴',
  '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗',
  '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧',
  '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕',
  '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎',
];

const MALE_NAMES = [
  '浩然', '子轩', '宇轩', '一鸣', '天宇', '子涵', '博文', '俊杰',
  '思远', '逸飞', '明哲', '志强', '鹏飞', '文博', '泽宇', '嘉诚',
  '睿轩', '浩宇', '梓豪', '昊天', '晨阳', '雨泽', '铭泽', '奕辰',
  '星辰', '子安', '景行', '修远', '弘毅', '承志',
  '小军', '伟明', '建华', '建国', '志明', '国栋', '振华', '文华',
  '永强', '志伟', '海峰', '志远', '晓明', '学军', '浩', '宇',
  '涛', '浩', '强', '磊', '飞', '龙', '勇', '杰',
  '明', '亮', '刚', '峰', '翔', '斌', '鹏', '凯',
];

const FEMALE_NAMES = [
  '雨涵', '诗涵', '欣怡', '梓涵', '紫萱', '雨婷', '梦瑶', '佳琪',
  '思雨', '晓雪', '文静', '雅楠', '美琳', '思涵', '若曦', '艺涵',
  '语嫣', '静怡', '雪婷', '晓彤', '可欣', '梦洁', '诗雨', '语桐',
  '依诺', '佳怡', '一诺', '晨曦', '安琪', '心怡',
  '小丽', '秀英', '桂英', '玉兰', '秀兰', '秀珍', '玉珍', '桂兰',
  '秀芳', '玉芬', '淑芬', '美玲', '海燕', '雪梅', '春梅', '小芳',
  '婷', '颖', '瑶', '琳', '珊', '萍', '洁', '雪',
  '月', '琴', '霞', '芳', '云', '燕', '莉', '娟',
];

const PARENT_LAST_NAMES = LAST_NAMES; // 家长也可能姓不同
const PARENT_FIRST_NAMES = [
  '建国', '建军', '国强', '志强', '伟明', '志明', '文华', '振华',
  '海峰', '永强', '志伟', '晓明', '学军', '大伟', '建华', '国栋',
  '秀英', '桂英', '玉兰', '秀兰', '秀珍', '小丽', '美玲', '玉芬',
  '淑芬', '秀芳', '海燕', '雪梅', '春梅', '小芳', '秀云', '桂兰',
  '明', '华', '军', '强', '伟', '勇', '斌', '峰',
  '丽', '芳', '英', '敏', '静', '娟', '婷', '玲',
];

const GENDERS = ['男', '女'] as const;

const GRADES = [
  '幼儿园', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三', '其他',
];

// ── 工具函数 ────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generatePhone(): string {
  // 手机号: 1[3-9] + 9位随机数字
  const prefix = pick([3, 5, 6, 7, 8, 9]);
  let tail = '';
  for (let i = 0; i < 9; i++) {
    tail += Math.floor(Math.random() * 10);
  }
  return `1${prefix}${tail}`;
}

function randomDate(start: Date, end: Date): Date {
  const t = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
}

function genStudentName(gender: '男' | '女'): string {
  const last = pick(LAST_NAMES);
  const first = gender === '男' ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  return last + first;
}

function genParentName(): string {
  const last = pick(PARENT_LAST_NAMES);
  const first = pick(PARENT_FIRST_NAMES);
  return last + first;
}

function randomCourseHours(): number {
  return pick([10, 15, 20, 24, 30, 36, 40, 48, 50, 60]);
}

function randomTuition(hours: number): number {
  // 课时单价 80~200 元
  const unitPrice = Math.round((80 + Math.random() * 120) * 100) / 100;
  return Math.round(hours * unitPrice * 100) / 100;
}

// ── 超级管理员种子 ──────────────────────────────────────────

async function seedSuperAdmin() {
  // Check .env or use defaults
  const username = process.env.SUPER_ADMIN_USERNAME || 'admin';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
  const forceReset = process.env.SUPER_ADMIN_FORCE_RESET !== 'false';

  const existing = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN', username },
  });

  if (existing) {
    console.log('  👑 SUPER_ADMIN already exists, skipping.');
    return;
  }

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      mustResetPassword: forceReset,
    },
  });

  console.log(`  👑 SUPER_ADMIN created: username="${username}", forceReset=${forceReset}`);
}

// ── 主流程 ──────────────────────────────────────────────────

async function main() {
  console.log('🌱 开始生成 100 条学生数据...\n');

  // 先清空已有数据（按外键依赖顺序）
  await prisma.classRecord.deleteMany();
  await prisma.courseInfo.deleteMany();
  await prisma.student.deleteMany();

  // 重置自增序列
  await prisma.$executeRawUnsafe(
    "ALTER SEQUENCE students_id_seq RESTART WITH 1"
  );
  await prisma.$executeRawUnsafe(
    "ALTER SEQUENCE course_infos_id_seq RESTART WITH 1"
  );
  await prisma.$executeRawUnsafe(
    "ALTER SEQUENCE class_records_id_seq RESTART WITH 1"
  );

  const phones = new Set<string>();
  const students: Array<{
    name: string;
    parentName: string;
    gender: string;
    grade: string;
    phone: string;
    enrollmentDate: Date;
  }> = [];

  for (let i = 0; i < 100; i++) {
    const gender = pick(GENDERS);
    let phone = generatePhone();
    // 确保手机号不重复
    while (phones.has(phone)) {
      phone = generatePhone();
    }
    phones.add(phone);

    students.push({
      name: genStudentName(gender),
      parentName: genParentName(),
      gender,
      grade: pick(GRADES),
      phone,
      enrollmentDate: randomDate(new Date('2024-01-01'), new Date('2026-06-18')),
    });
  }

  // 批量插入学生
  let count = 0;
  for (const s of students) {
    await prisma.student.create({ data: s });
    count++;
    if (count % 20 === 0) {
      console.log(`  ✅ 已插入 ${count}/100 条学生记录`);
    }
  }

  // 为约 60% 的学生创建课程报名记录
  console.log('\n📚 为学生生成课程报名记录...');
  const allStudents = await prisma.student.findMany({ orderBy: { id: 'asc' } });
  const studentsWithCourse = pickN(allStudents, 60);

  for (const s of studentsWithCourse) {
    // 每个学生 1~3 条报名记录
    const courseCount = pick([1, 1, 1, 2, 2, 3]);
    for (let j = 0; j < courseCount; j++) {
      const hours = randomCourseHours();
      await prisma.courseInfo.create({
        data: {
          studentId: s.id,
          hours,
          tuition: randomTuition(hours),
          enrollmentDate: s.enrollmentDate,
        },
      });
    }
  }
  console.log(`  ✅ 为 ${studentsWithCourse.length} 名学生创建了课程记录`);

  // 为部分学生生成上课记录
  console.log('\n🏄 为学生生成上课记录...');
  const studentsWithRecords = pickN(studentsWithCourse, 40);

  for (const s of studentsWithRecords) {
    // 每个学生 2~8 条上课记录
    const recordCount = 2 + Math.floor(Math.random() * 7);
    const courseInfos = await prisma.courseInfo.findMany({
      where: { studentId: s.id },
      orderBy: { enrollmentDate: 'asc' },
    });
    const totalHours = courseInfos.reduce((sum, c) => sum + c.hours, 0);
    const usedHours = Math.min(
      Math.floor(Math.random() * totalHours * 0.7) + 1,
      totalHours - 1
    );

    // 将已消耗课时随机分配到若干次上课记录
    const parts = recordCount;
    let remaining = usedHours;
    for (let j = 0; j < parts && remaining > 0; j++) {
      const isLast = j === parts - 1;
      const h = isLast ? remaining : Math.max(1, Math.floor(Math.random() * Math.min(3, remaining)) + 1);
      if (h > remaining) break;
      remaining -= h;

      const classDate = randomDate(s.enrollmentDate, new Date('2026-06-18'));
      await prisma.classRecord.create({
        data: {
          studentId: s.id,
          classDate,
          startTime: pick(['09:00', '10:30', '14:00', '15:30', '16:00', '18:30']),
          endTime: pick(['10:30', '12:00', '15:30', '17:00', '17:30', '20:00']),
          hours: h,
        },
      });
    }
  }
  console.log(`  ✅ 为 ${studentsWithRecords.length} 名学生创建了上课记录`);

  // ── 创建超级管理员 ──────────────────────────────────────
  await seedSuperAdmin();

  // ── 汇总 ──────────────────────────────────────────────────
  const totalStudents = await prisma.student.count();
  const totalCourses = await prisma.courseInfo.count();
  const totalRecords = await prisma.classRecord.count();

  console.log('\n═══════════════════════════════════════');
  console.log('  🎉 数据生成完成！');
  console.log(`     学生总数:    ${totalStudents} 人`);
  console.log(`     课程记录:    ${totalCourses} 条`);
  console.log(`     上课记录:    ${totalRecords} 条`);
  console.log('═══════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ 生成失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
