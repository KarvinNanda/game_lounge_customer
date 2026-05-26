import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/CustomerLayout.vue'),
    children: [
      { path: '',           name: 'Home',         component: () => import('@/views/HomeView.vue') },
      { path: 'banner/:id', name: 'BannerDetail', component: () => import('@/views/banner/BannerDetailView.vue') },
      { path: 'profile',         name: 'Profile',        component: () => import('@/views/ProfileView.vue'),         meta: { requiresAuth: true } },
      { path: 'booking',         name: 'Booking',        component: () => import('@/views/BookingView.vue') },
      { path: 'payment/success', name: 'PaymentSuccess', component: () => import('@/views/PaymentSuccessView.vue') },
      { path: 'payment/failed',  name: 'PaymentFailed',  component: () => import('@/views/PaymentFailedView.vue') },
      { path: 'payment/mock',    name: 'PaymentMock',    component: () => import('@/views/PaymentMockView.vue') },
      { path: 'credits',         name: 'Credits',        component: () => import('@/views/CreditsView.vue') },
      { path: 'credits/success', name: 'CreditsSuccess', component: () => import('@/views/CreditsSuccessView.vue') },
      { path: 'credits/failed',  name: 'CreditsFailed',  component: () => import('@/views/CreditsFailedView.vue') },
      { path: 'my-bookings',     name: 'MyBookings',     component: () => import('@/views/MyBookingsView.vue'),      meta: { requiresAuth: true } },
      { path: 'my-credits',      name: 'MyCredits',      component: () => import('@/views/MyCreditsView.vue'),       meta: { requiresAuth: true } },
      { path: 'promo',           name: 'Promo',          component: () => import('@/views/PromoView.vue'),            meta: { requiresAuth: true } },
      { path: 'event-booking',   name: 'EventBooking',   component: () => import('@/views/EventBookingView.vue'),    meta: { requiresAuth: true } },
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('@/views/auth/ForgotPasswordView.vue'),
  },
  {
    path: '/reset-password/:token',
    name: 'ResetPassword',
    component: () => import('@/views/auth/ResetPasswordView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

// Navigation guard — redirect unauthenticated users to login
router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAuth && !useAuthStore().isLoggedIn) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
