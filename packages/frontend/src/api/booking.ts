import request from './request'
import type { EligibleStudent } from '../types/student'

export function getEligibleStudents() {
  return request.get('/booking/eligible-students') as Promise<EligibleStudent[]>
}

export function bookClass(data: {
  studentId: number
  classDate: string
  hours: number
  startTime?: string
  endTime?: string
}) {
  return request.post('/booking', data)
}
