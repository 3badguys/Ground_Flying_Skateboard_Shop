import { createRouter, createWebHistory } from 'vue-router'
import StudentList from '../views/student/StudentList.vue'
import BookingForm from '../views/booking/BookingForm.vue'
import CalendarView from '../views/calendar/CalendarView.vue'
import StatisticsView from '../views/statistics/StatisticsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/students',
    },
    {
      path: '/students',
      name: 'StudentList',
      component: StudentList,
    },
    {
      path: '/booking',
      name: 'Booking',
      component: BookingForm,
    },
    {
      path: '/statistics',
      name: 'Statistics',
      component: StatisticsView,
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: CalendarView,
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/settings/SystemSettings.vue'),
    },
  ],
})

export default router
