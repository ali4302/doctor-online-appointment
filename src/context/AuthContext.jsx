import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService, setAuthToken } from '../services/api'

const AuthContext = createContext({
  user: null,
  admin: null,
  loading: false,
  login: async () => {},
  loginAsAdmin: async () => {},
  register: async () => {},
  updateProfile: async () => {},
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedUser = localStorage.getItem('medi_session_user')
    const savedToken = localStorage.getItem('medi_session_token')
    if (savedToken) setAuthToken(savedToken)
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)) } catch(e) { console.error(e) }
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const res = await authService.login({ email, password })
    const userData = { ...res.user, role: res.role }
    setUser(userData)
    localStorage.setItem('medi_session_user', JSON.stringify(userData))
    localStorage.setItem('medi_session_token', res.token)
    setAuthToken(res.token)
    return res.user
  }

  async function loginAsAdmin(email, password) {
    const res = await authService.login({ email, password })
    if (res.role !== 'admin') throw new Error('Admin credentials required')
    const userData = { ...res.user, role: res.role }
    setUser(userData)
    localStorage.setItem('medi_session_user', JSON.stringify(userData))
    localStorage.setItem('medi_session_token', res.token)
    setAuthToken(res.token)
    return res.user
  }

  async function register(data) { 
    return authService.register(data) 
  }

  async function updateProfile(data) {
    const updated = await authService.updateProfile(user.id, data)
    const updatedWithRole = { ...updated, role: user.role }
    setUser(updatedWithRole)
    localStorage.setItem('medi_session_user', JSON.stringify(updatedWithRole))
    return updated
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('medi_session_user')
    localStorage.removeItem('medi_session_token')
    setAuthToken(null)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      admin: user?.role === 'admin' ? user : null,
      loading, 
      login, 
      loginAsAdmin, 
      register, 
      updateProfile, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }