import client from './client'

export const tripPlannerApi = {
  getRoute:         (params) => client.get('/trip-planner/route', { params }),
  getTransportCost: (params) => client.get('/trip-planner/transport-cost', { params }),
  getTravelTime:    (params) => client.get('/trip-planner/travel-time', { params }),
  getTripBudget:    (params) => client.get('/trip-planner/trip-budget', { params }),
  smartCalculate:   (params) => client.get('/trip-planner/smart-calculate', { params }),
  createItinerary:  (data)   => client.post('/trip-planner/itinerary', data),
  getItinerary:     (id)     => client.get(`/trip-planner/itinerary/${id}`),
}