export interface CourseForCalc {
  id: number;
  hours: number;
  tuition: number;
  enrollmentDate: Date;
}
export interface RecordForCalc {
  id: number;
  hours: number;
  classDate: Date;
}

export function computeClassFees(
  courses: CourseForCalc[],
  records: RecordForCalc[],
): Map<number, number> {
  const result = new Map<number, number>();
  if (courses.length === 0 || records.length === 0) return result;

  // Sort courses by enrollment date (FIFO), records by class date
  const sortedCourses = [...courses].sort(
    (a, b) => a.enrollmentDate.getTime() - b.enrollmentDate.getTime(),
  );
  const sortedRecords = [...records].sort(
    (a, b) => a.classDate.getTime() - b.classDate.getTime(),
  );

  // Track remaining hours per course
  const remaining = new Map<number, number>();
  for (const c of sortedCourses) {
    remaining.set(c.id, c.hours);
  }

  let courseIdx = 0;

  for (const record of sortedRecords) {
    let hoursToAllocate = record.hours;
    let fee = 0;

    while (hoursToAllocate > 0 && courseIdx < sortedCourses.length) {
      const course = sortedCourses[courseIdx];
      const rem = remaining.get(course.id)!;
      const unitPrice = course.tuition / course.hours;

      if (rem <= 0) {
        courseIdx++;
        continue;
      }

      const take = Math.min(hoursToAllocate, rem);
      fee += take * unitPrice;
      remaining.set(course.id, rem - take);
      hoursToAllocate -= take;

      if (rem - take <= 0) courseIdx++;
    }

    result.set(record.id, Math.round(fee * 100) / 100);
  }

  return result;
}
