import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import authService from '../services/authService'

export function useAuth() {
  const store = useStore()
  const router = useRouter()

  const isAuthenticated = computed(() => store.getters.isAuthenticated)
  const currentUser = computed(() => store.getters.currentUser)
  const token = computed(() => store.getters.token)
  const isAdmin = computed(() => store.getters.isAdmin)

  const login = async (email, password) => {
    const result = await authService.login(email, password)

    if (result.success) {
      store.dispatch('login', {
        user: result.data.user,
        token: result.data.token,
      })
      return { success: true }
    } else {
      return { success: false, error: result.error }
    }
  }

  const register = async (email, password, username, confirmPassword) => {
    const result = await authService.register(email, password, username, confirmPassword)

    if (result.success) {
      const user = {
        ...result.data.user,
        admin: result.data.user.admin
      }

      store.dispatch('register', {
        user: user,
        token: result.data.token,
      })
      return { success: true }
    } else {
      return { success: false, error: result.error }
    }
  }

  const logout = () => {
    store.dispatch('logout')
    window.location.href = '/login'
    router.push({ name: 'Login' })
  }

  return {
    isAuthenticated,
    currentUser,
    token,
    isAdmin,
    login,
    register,
    logout,
  }
}