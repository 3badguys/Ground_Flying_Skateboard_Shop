import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn, getUser } from '../utils/auth'
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
      path: '/login',
      name: 'Login',
      component: () => import('../views/auth/LoginView.vue'),
      meta: { public: true },
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
    {
      path: '/account',
      name: 'Account',
      component: () => import('../views/auth/AccountView.vue'),
    },
    {
      path: '/users',
      name: 'UserManagement',
      component: () => import('../views/auth/UserManagement.vue'),
      meta: { roles: ['SUPER_ADMIN', 'ADMIN'] },
    },
  ],
})

// ── Navigation guard ────────────────────────────────────────
router.beforeEach((to, _from, next) => {
  const loggedIn = isLoggedIn()
  const user = getUser()

  // Determine safe home page for current role
  const homePath = user?.role === 'USER' ? '/account' : '/students'

  // Public routes
  if (to.meta.public) {
    // Already logged in? Redirect away from login
    if (loggedIn && to.path === '/login') {
      next(homePath)
      return
    }
    next()
    return
  }

  // Protected: redirect to login if not authenticated
  if (!loggedIn) {
    next('/login')
    return
  }

  // Role-based access
  if (to.meta.roles) {
    const requiredRoles = to.meta.roles as string[]
    if (!user || !requiredRoles.includes(user.role)) {
      next(homePath)
      return
    }
  }

  // USER role can only access /account, /booking, and /calendar
  if (user?.role === 'USER' && !['/account', '/booking', '/calendar'].includes(to.path)) {
    next('/account')
    return
  }

  next()
})

export default router
