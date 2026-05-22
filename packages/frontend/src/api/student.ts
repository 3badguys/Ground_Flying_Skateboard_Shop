import request from './request'
import type { Student, StudentDetail, PaginatedResponse } from '../types/student'

export function getStudents(params: {
  page?: number
  pageSize?: number
  keyword?: string
  grade?: string
  gender?: string
  sortBy?: string
  sortOrder?: string
}) {
  return request.get('/students', { params }) as Promise<
    PaginatedResponse<Student[]>
  >
}

export function getStudent(id: number) {
  return request.get(`/students/${id}`) as Promise<StudentDetail>
}

export function createStudent(data: {
  name: string
  parentName: string
  gender: string
  grade: string
  phone: string
  enrollmentDate: string
  hours?: number
  tuition?: number
}) {
  return request.post('/students', data)
}

export function updateStudent(
  id: number,
  data: {
    name?: string
    parentName?: string
    gender?: string
    grade?: string
    phone?: string
    enrollmentDate?: string
  },
) {
  return request.put(`/students/${id}`, data)
}

export function deleteStudent(id: number) {
  return request.delete(`/students/${id}`)
}
