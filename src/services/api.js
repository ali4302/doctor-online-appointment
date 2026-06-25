import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'https://medcare-clinic-system-backend.vercel.app/api')
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const cache = {
  doctors: { data: null, expiry: 0 },
  doctorById: new Map(),
}

function setDoctorsCache(doctors) {
  const now = Date.now()
  cache.doctors = { data: doctors, expiry: now + 5 * 60 * 1000 }
  cache.doctorById.clear()
  doctors.forEach((doctor) => { if (doctor?.id) cache.doctorById.set(doctor.id, doctor) })
}

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`
  else delete api.defaults.headers.common.Authorization
}

export const TIME_SLOTS_LIST = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
]

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

function normalizeStatus(status) {
  if (typeof status !== 'string') return status
  const lower = status.toLowerCase()
  if (lower === 'approved') return 'Confirmed'
  if (lower === 'pending') return 'Pending'
  if (lower === 'completed') return 'Completed'
  if (lower === 'cancelled') return 'Cancelled'
  return status
}

function toBackendStatus(status) {
  if (typeof status !== 'string') return status
  const lower = status.toLowerCase()
  if (lower === 'confirmed') return 'approved'
  if (lower === 'pending') return 'pending'
  if (lower === 'completed') return 'completed'
  if (lower === 'cancelled') return 'cancelled'
  return status
}

function normalizeUser(raw) {
  if (!raw) return null
  return {
    ...raw,
    id: raw.id || raw._id,
    name: raw.fullName || raw.name || '',
    fullName: raw.fullName || raw.name || '',
  }
}

function normalizeDoctor(raw) {
  if (!raw) return null
  const workingDays = raw.workingDays || raw.availability || []
  return {
    ...raw,
    id: raw.id || raw._id,
    name: raw.fullName || raw.name || '',
    specialization: raw.specialization,
    experience: raw.experience,
    fee: raw.consultationFee ?? raw.fee,
    bio: raw.bio ?? raw.qualification ?? '',
    phone: raw.phone,
    email: raw.email,
    availability: Array.isArray(workingDays) ? workingDays : [workingDays].filter(Boolean),
    workingDays: Array.isArray(workingDays) ? workingDays : [workingDays].filter(Boolean),
    startTime: raw.startTime || raw.start_time || '09:00 AM',
    endTime: raw.endTime || raw.end_time || '05:00 PM',
    rating: raw.rating ?? 4.8,
    reviews: raw.reviews ?? 0,
  }
}

function normalizeAppointment(raw) {
  if (!raw) return null
  return {
    ...raw,
    id: raw.id || raw._id,
    date: raw.appointmentDate ? new Date(raw.appointmentDate).toISOString().split('T')[0] : raw.date,
    time: raw.appointmentTime || raw.time,
    symptoms: raw.reason || raw.symptoms || '',
    status: normalizeStatus(raw.status),
    doctor: normalizeDoctor(raw.doctor),
    patient: normalizeUser(raw.patient),
  }
}

function normalizeList(rawList, normalizeFn) {
  return (rawList || []).map(normalizeFn)
}

function normalizeNotification(raw) {
  if (!raw) return null
  return {
    id: raw.id || raw._id,
    patientId: raw.patientId || raw.patient?.id || raw.patient?._id,
    message: raw.message || raw.body || '',
    createdAt: raw.createdAt || raw.created_at || raw.createdOn || raw.date,
    read: raw.read ?? raw.isRead ?? raw.read_at ? true : false,
    metadata: raw.metadata || raw.meta || null,
  }
}

function getResponseItems(res) {
  const payload = res?.data?.data ?? res?.data
  if (!payload) return []
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload.notifications)) return payload.notifications
  if (Array.isArray(payload.items)) return payload.items
  return []
}

const authPayload = (data) => ({
  fullName: data.name,
  email: data.email,
  password: data.password,
  phone: data.phone,
  role: 'patient',
  gender: data.gender || '',
  age: data.age || '',
  address: data.address || '',
})

export const authService = {
  register: async (data) => {
    const res = await api.post('/auth/register', authPayload(data))
    const user = normalizeUser(res.data.data.user)
    return { user, role: user.role, token: res.data.data.token }
  },
  login: async ({ email, password }) => {
    const res = await api.post('/auth/login', { email, password })
    const user = normalizeUser(res.data.data.user)
    return { user, role: user.role, token: res.data.data.token }
  },
  updateProfile: async (id, data) => {
    const body = {
      fullName: data.name,
      phone: data.phone,
      gender: data.gender,
      age: data.age,
      address: data.address,
    }
    const res = await api.put('/profile', body)
    return normalizeUser(res.data.data)
  },
}

export const doctorService = {
  getAll: async (force = false) => {
    const now = Date.now()
    if (!force && cache.doctors.data && now < cache.doctors.expiry) {
      return cache.doctors.data
    }
    const res = await api.get('/doctors')
    const doctors = normalizeList(getResponseItems(res), normalizeDoctor)
    setDoctorsCache(doctors)
    return doctors
  },
  getById: async (id, force = false) => {
    if (!force && cache.doctorById.has(id)) {
      return cache.doctorById.get(id)
    }
    const res = await api.get(`/doctors/${id}`)
    const doctor = normalizeDoctor(res.data.data ?? res.data)
    if (doctor) cache.doctorById.set(doctor.id, doctor)
    return doctor
  },
  create: async (data) => {
    const body = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone,
      role: 'doctor',
      gender: data.gender,
      age: Number(data.age),
      address: data.address,
      specialization: data.specialization,
      experience: data.experience,
      qualification: data.qualification,
      consultationFee: Number(data.consultationFee),
    }
    const res = await api.post('/admin/doctors', body)
    return normalizeDoctor(res.data.data.doctor)
  },
}

export const appointmentService = {
  getByPatient: async () => {
    const res = await api.get('/appointments/my')
    return normalizeList(res.data.data, normalizeAppointment)
  },
  getAll: async () => {
    const res = await api.get('/appointments')
    return normalizeList(res.data.data, normalizeAppointment)
  },
  book: async (data) => {
    const body = {
      doctor: data.doctor,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime,
      reason: data.reason,
    }
    const res = await api.post('/appointments', body)
    return normalizeAppointment(res.data.data.appointment)
  },
  updateStatus: async (id, status) => {
    const body = { status: toBackendStatus(status) }
    const res = await api.put(`/appointments/${id}/status`, body)
    return normalizeAppointment(res.data.data)
  },
  cancel: async (id) => {
    const res = await api.put(`/appointments/${id}/cancel`)
    return normalizeAppointment(res.data.data)
  },
}

export const patientService = {
  getAll: async () => {
    const res = await api.get('/patient')
    return normalizeList(res.data.data, normalizeUser)
  },
}

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard')
    return res.data.data || {}
  },
}

export const notificationService = {
  getByPatient: async (patientId) => {
    const res = await api.get(`/notifications/patient/${patientId}`)
    return normalizeList(getResponseItems(res), normalizeNotification)
  },
  getAll: async () => {
    const res = await api.get('/notifications')
    return normalizeList(getResponseItems(res), normalizeNotification)
  },
  markRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`)
    return normalizeNotification(res.data.data || res.data)
  },
  sendNotification: async (patientId, message) => {
    const body = { patientId, message }
    const res = await api.post('/notifications', body)
    return normalizeNotification(res.data.data || res.data)
  },
}