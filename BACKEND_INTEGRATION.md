# Backend Integration Guide

## Overview
This project connects the React/Vite frontend to the MedCare backend API at:
`https://medcare-clinic-system-backend.vercel.app/api`

The integration includes:
- centralized Axios API client in `src/services/api.js`
- Vite development proxy for local requests
- auth token handling
- doctor, appointment, patient, admin, and notification service wrappers
- error handling and caching improvements

## Vite Proxy Setup
Local development is configured to proxy `/api` requests through Vite, which avoids browser CORS issues.

File: `vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://medcare-clinic-system-backend.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
```

## API Client
The Axios client lives in `src/services/api.js`.

Key points:
- uses `/api` base URL in development
- uses the remote backend URL in production
- sets JSON headers
- exports `setAuthToken(token)` to attach `Authorization: Bearer <token>`

```js
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'https://medcare-clinic-system-backend.vercel.app/api')
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})
```

## Auth Integration
Auth is managed by `src/context/AuthContext.jsx` and `authService` in `src/services/api.js`.

`authService` endpoints:
- `POST /auth/register`
- `POST /auth/login`
- `PUT /profile`

The frontend stores the session token and user object in local storage and attaches the bearer token to future API requests.

## Services
### Doctors
`doctorService` handles doctor-related API calls:
- `getAll()` → `GET /doctors`
- `getById(id)` → `GET /doctors/{id}`
- `create(data)` → `POST /admin/doctors`

A local in-memory cache was added for better performance.

### Appointments
`appointmentService` handles appointment flows:
- `getByPatient()` → `GET /appointments/my`
- `getAll()` → `GET /appointments`
- `book(data)` → `POST /appointments`
- `updateStatus(id, status)` → `PUT /appointments/{id}/status`

### Notifications
`notificationService` handles notifications:
- `getByPatient(patientId)` → `GET /notifications/patient/{patientId}`
- `getAll()` → `GET /notifications`
- `markRead(id)` → `PUT /notifications/{id}/read`
- `sendNotification(patientId, message)` → `POST /notifications`

> Note: email delivery depends on backend configuration. The frontend can request notifications, but actual email sending requires backend SMTP/third-party provider setup.

## Pages Using Backend
The following pages now use the backend API:
- `src/pages/Home.jsx`
- `src/pages/Doctors.jsx`
- `src/pages/DoctorProfile.jsx`
- `src/pages/BookAppointment.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/MyAppointments.jsx`
- `src/pages/Notifications.jsx`
- `src/pages/admin/*`

## Running Locally
From the project root:

```powershell
cd "C:\Users\Hp\OneDrive\Desktop\Online Doctor Appointment System\Online Doctor Appointment System"
npm run dev
```

Open the app at `http://localhost:5173/`.

## Notes
- If the app shows network errors in development, make sure the Vite proxy is enabled and the backend is reachable.
- The demo login credentials are displayed in `src/pages/Login.jsx`.
- `409` errors on registration typically mean the email already exists.
- If email notifications do not arrive, verify backend email service settings and notification triggers.
