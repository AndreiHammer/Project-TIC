import axios from 'axios'

// Use environment variable if set, otherwise default to backend URL
const API_BASE_URL = process.env.VUE_APP_API_URL || 'http://localhost:8080/api/users'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
})

export const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/login', {
        email,
        password,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      
      const errorData = error.response?.data
      if (errorData) {
        return {
          success: false,
          error: Array.isArray(errorData.error) 
            ? errorData.error 
            : errorData.error || 'Login failed',
        }
      }
      
      return {
        success: false,
        error: error.message || 'Login failed',
      }
    }
  },

  async register(email, password, username, confirmPassword) {
    try {
      const response = await api.post('/register', {
        email,
        password,
        username,
        confirmPassword,
      })
      return {
        success: true,
        data: response.data,
      }
    } catch (error) {
      
      const errorData = error.response?.data
      if (errorData) {
        return {
          success: false,
          error: Array.isArray(errorData.error) 
            ? errorData.error 
            : errorData.error || 'Registration failed',
        }
      }
      
      return {
        success: false,
        error: error.message || 'Registration failed',
      }
    }
  },
}

export default authService
