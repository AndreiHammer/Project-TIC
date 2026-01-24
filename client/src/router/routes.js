import { createRouter, createWebHistory } from 'vue-router'
import store from '../store/authStore'

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: () => {
      const isAuthenticated = store.getters.isAuthenticated
      const isAdmin = store.getters.isAdmin

      if (!isAuthenticated) {
        return { name: 'Login' }
      }

      return isAdmin ? { name: 'AdminDashboard' } : { name: 'UserDashboard' }
    },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login Page.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register Page.vue'),
    meta: { requiresGuest: true },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/Admin Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/dashboard',
    name: 'UserDashboard',
    component: () => import('../views/User Dashboard.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('../views/User Profile.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/products',
    name: 'Products',
    component: () => import('../views/Product List.vue'),
    meta: {
      requiresAuth: true,
      keepAlive: true
    },
  },
  {
    path: '/products/:id',
    name: 'ProductDetail',
    component: () => import('../views/Product Detail.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/cart',
    name: 'Cart',
    component: () => import('../views/Cart.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/Checkout.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/orders',
    name: 'Orders',
    component: () => import('../views/User Orders.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('../views/Product Management.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/orders',
    name: 'AdminOrders',
    component: () => import('../views/Admin Orders.vue'),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/Not Found.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.name === 'Products' && from.name === 'ProductDetail') {
      return savedPosition || { top: 0 }
    }

    return { top: 0 }
  },
})

router.beforeEach((to, from, next) => {
  const isAuthenticated = store.getters.isAuthenticated
  const isAdmin = store.getters.isAdmin

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.requiresAdmin && !isAdmin) {
    next({ name: 'UserDashboard' })
    return
  }

  if (to.meta.requiresGuest && isAuthenticated) {
    next({ name: isAdmin ? 'AdminDashboard' : 'UserDashboard' })
    return
  }

  next()
})

export default router