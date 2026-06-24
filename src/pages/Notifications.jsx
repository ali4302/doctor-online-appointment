import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';
import Loader from '../components/common/Loader';
import { Bell, CheckCheck } from 'lucide-react';

export default function Notifications() {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await notificationService.getByPatient(user.id)
        setNotifs(data)
      } catch (err) {
        console.error(err)
        setError('Unable to load notifications. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) load()
  }, [user?.id])

  const markRead = async (id) => {
    setProcessingId(id)
    setError('')
    try {
      await notificationService.markRead(id)
      setNotifs((current) => current.map((x) => (x.id === id ? { ...x, read: true } : x)))
    } catch (err) {
      console.error(err)
      setError('Unable to mark notification as read. Please try again.')
    } finally {
      setProcessingId(null)
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">{notifs.filter((n) => !n.read).length} unread</p>
        </div>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>
      )}
      {loading ? (
        <Loader />
      ) : notifs.length === 0 ? (
        <div className="card text-center py-12">
          <Bell className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="text-slate-500 font-medium">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifs.map((n) => (
            <div key={n.id} className={`card flex items-start gap-3 transition-all ${!n.read ? 'border-primary/30 bg-primary-pale/30' : ''}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${!n.read ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm leading-relaxed ${!n.read ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && (
                <button
                  onClick={() => markRead(n.id)}
                  disabled={processingId === n.id}
                  className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {processingId === n.id ? 'Saving...' : 'Mark read'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
