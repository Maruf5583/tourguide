import client from './client'

export const realtimeApi = {
  getCrowdLevel:     (placeId) => client.get(`/realtime/crowd-level/${placeId}`),
  updateLiveVisitor: (placeId, data) => client.patch(`/realtime/live-visitor/${placeId}`, data),
  sendWeatherAlert:  (data) => client.post('/realtime/weather-alert', data),
}