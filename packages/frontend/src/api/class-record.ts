import request from './request'
import type { ClassRecord } from '../types/student'

export function getClassRecords(studentId: number) {
  return request.get(
    `/students/${studentId}/class-records`,
  ) as Promise<ClassRecord[]>
}

export function createClassRecord(
  studentId: number,
  data: { classDate: string; hours: number },
) {
  return request.post(`/students/${studentId}/class-records`, data)
}

export function updateClassRecord(
  id: number,
  data: { classDate?: string; hours?: number },
) {
  return request.put(`/class-records/${id}`, data)
}

export function deleteClassRecord(id: number) {
  return request.delete(`/class-records/${id}`)
}

export function getCalendar(month: string) {
  return request.get('/class-records/calendar', { params: { month } })
}
