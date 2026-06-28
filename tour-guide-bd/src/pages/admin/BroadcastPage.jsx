import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { adminApi } from '../../api/admin.api'
import { realtimeApi } from '../../api/realtime.api'
import { useAuthStore } from '../../store/auth.store'
import { Send, CloudLightning, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BroadcastPage() {
  const { user } = useAuthStore()
  const [broadcast, setBroadcast] = useState({ title: '', message: '', districtId: '' })
  const [weather, setWeather]     = useState({ districtId: '', title: '', message: '', severity: 'Low', validUntil: '' })

  const broadcastMutation = useMutation({
    mutationFn: (data) => adminApi.broadcast(data),
    onSuccess: (res) => toast.success(`Broadcast sent to ${res.data} users`),
    onError: () => toast.error('Broadcast failed'),
  })

  const weatherMutation = useMutation({
    mutationFn: (data) => realtimeApi.sendWeatherAlert(data),
    onSuccess: () => toast.success('Weather alert sent'),
    onError: () => toast.error('Alert failed'),
  })

  const cacheMutation = useMutation({
    mutationFn: (data) => adminApi.flushCache(data),
    onSuccess: () => toast.success('Cache flushed'),
    onError: () => toast.error('Failed'),
  })

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900">Broadcast & alerts</h1>

      {/* Broadcast */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send size={16} className="text-primary-600" /> Send broadcast
        </h2>
        <div className="space-y-3">
          <input value={broadcast.title} onChange={(e) => setBroadcast({ ...broadcast, title: e.target.value })}
            placeholder="Title" className="input" />
          <textarea value={broadcast.message} onChange={(e) => setBroadcast({ ...broadcast, message: e.target.value })}
            placeholder="Message" rows={3} className="input resize-none" />
          <input type="number" value={broadcast.districtId}
            onChange={(e) => setBroadcast({ ...broadcast, districtId: e.target.value })}
            placeholder="District ID (optional)" className="input" />
          <button onClick={() => broadcastMutation.mutate({ ...broadcast, sentByUserId: user?.id })}
            disabled={!broadcast.title || !broadcast.message || broadcastMutation.isPending}
            className="btn-primary flex items-center gap-2">
            <Send size={15} /> {broadcastMutation.isPending ? 'Sending…' : 'Send broadcast'}
          </button>
        </div>
      </div>

      {/* Weather alert */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <CloudLightning size={16} className="text-amber-500" /> Weather alert
        </h2>
        <div className="space-y-3">
          <input type="number" value={weather.districtId}
            onChange={(e) => setWeather({ ...weather, districtId: Number(e.target.value) })}
            placeholder="District ID" className="input" />
          <input value={weather.title} onChange={(e) => setWeather({ ...weather, title: e.target.value })}
            placeholder="Alert title" className="input" />
          <textarea value={weather.message} onChange={(e) => setWeather({ ...weather, message: e.target.value })}
            placeholder="Alert message" rows={3} className="input resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select value={weather.severity} onChange={(e) => setWeather({ ...weather, severity: e.target.value })} className="input">
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
            <input type="datetime-local" value={weather.validUntil}
              onChange={(e) => setWeather({ ...weather, validUntil: e.target.value })} className="input" />
          </div>
          <button onClick={() => weatherMutation.mutate({ ...weather })}
            disabled={!weather.districtId || !weather.title || weatherMutation.isPending}
            className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <CloudLightning size={15} /> {weatherMutation.isPending ? 'Sending…' : 'Send alert'}
          </button>
        </div>
      </div>

      {/* Flush cache */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trash2 size={16} className="text-red-500" /> Flush cache
        </h2>
        <div className="flex gap-3">
          <button onClick={() => cacheMutation.mutate({})}
            disabled={cacheMutation.isPending}
            className="btn-danger flex items-center gap-2">
            <Trash2 size={15} /> {cacheMutation.isPending ? 'Flushing…' : 'Flush all cache'}
          </button>
        </div>
      </div>
    </div>
  )
}