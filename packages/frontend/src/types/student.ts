export interface CourseInfo {
  id: number
  studentId: number
  hours: number
  tuition: number
  unitPrice?: number
  enrollmentDate: string
  createdAt: string
}

export interface ClassRecord {
  id: number
  studentId: number
  classDate: string
  startTime?: string
  endTime?: string
  hours: number
  classFee?: number
  createdAt: string
}

export interface Student {
  id: number
  name: string
  parentName: string
  gender: string
  grade: string
  phone: string
  enrollmentDate: string
  totalHours: number
  usedHours: number
  remainingHours: number
  totalTuition: number
  completedTuition: number
  createdAt: string
  updatedAt: string
}

export interface StudentDetail extends Student {
  courseInfos: CourseInfo[]
  classRecords: ClassRecord[]
}

export interface EligibleStudent {
  id: number
  name: string
  parentName: string
  remainingHours: number
}

export interface PaginatedResponse<T> {
  list: T
  total: number
  page: number
  pageSize: number
}
