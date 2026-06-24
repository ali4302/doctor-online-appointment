import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { Shield, Mail, Lock } from 'lucide-react'

export default function AdminLogin() {
  const { loginAsAdmin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await loginAsAdmin(form.email, form.password)
      navigate('/admin')
    } catch(err) { setError(err.message) } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3"><Shield size={26} className="text-teal-400"/></div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">Restricted access for administrators only</p>
        </div>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Admin Email" type="email" placeholder="admin@example.com" icon={Mail} value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
          <Input label="Password" type="password" placeholder="Admin password" icon={Lock} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? 'Verifying...' : 'Login as Admin'}</Button>
        </form>
      </div>
    </div>
  )
}
