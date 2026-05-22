import request from './request'
import type { CourseInfo } from '../types/student'

export function getCourseInfos(studentId: number) {
  return request.get(`/students/${studentId}/course-infos`) as Promise<CourseInfo[]>
}

export function createCourseInfo(
  studentId: number,
  data: { hours: number; tuition: number; enrollmentDate: string },
) {
  return request.post(`/students/${studentId}/course-infos`, data)
}

export function updateCourseInfo(
  id: number,
  data: { hours?: number; tuition?: number; enrollmentDate?: string },
) {
  return request.put(`/course-infos/${id}`, data)
}

export function deleteCourseInfo(id: number) {
  return request.delete(`/course-infos/${id}`)
}
