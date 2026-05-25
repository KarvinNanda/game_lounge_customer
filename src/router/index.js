import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/CustomerLayout.vue'),
    children: [
      { path: '',           name: 'Home',         component: () => import('@/views/HomeView.vue') },
      { path: 'banner/:id', name: 'BannerDetail', component: () => import('@/views/banner/BannerDetailView.vue') },
      { path: 'profile',         name: 'Profile',        component: () => import('@/views/ProfileView.vue') },
      { path: 'booking',         name: 'Booking',        component: () => import('@/views/BookingView.vue') },
      { path: 'payment/success', name: 'PaymentSuccess', component: () => import('@/views/PaymentSuccessView.vue') },
      { path: 'payment/failed',  name: 'PaymentFailed',  component: () => import('@/views/PaymentFailedView.vue') },
      { path: 'payment/mock',    name: 'PaymentMock',    component: () => import('@/views/PaymentMockView.vue') },
      // { path: 'credits',  name: 'Credits',  component: ... }
      // { path: 'promo',    name: 'Promo',    component: ... }
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

export default router
