import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: () => import('../pages/Home.vue')
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../pages/Login.vue')
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('../pages/Register.vue')
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: () => import('../pages/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/routes',
      name: 'RouteSearch',
      component: () => import('../pages/RouteSearch.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/routes/:id',
      name: 'RouteDetails',
      component: () => import('../pages/RouteDetails.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../pages/Profile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/preferences',
      name: 'Preferences',
      component: () => import('../pages/Preferences.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/' && authStore.isAuthenticated) {
    // Redirect authenticated users to dashboard instead of home
    next('/dashboard')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Redirect authenticated users trying to access login to dashboard
    next('/dashboard')
  } else {
    next()
  }
})

export default router

