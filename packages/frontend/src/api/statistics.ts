import request from './request'

export function getMonthlyIncome(year?: number) {
  return request.get('/statistics/monthly-income', { params: { year } })
}
export function getGradeDistribution() {
  return request.get('/statistics/grade-distribution')
}
export function getMonthlyHours(year?: number) {
  return request.get('/statistics/monthly-hours', { params: { year } })
}
export function getStudentRankings(type?: string) {
  return request.get('/statistics/student-rankings', { params: { type } })
}
export function getMonthlyEnrollment(year?: number) {
  return request.get('/statistics/monthly-enrollment', { params: { year } })
}
