import client from './client'

export const locationsApi = {
  getDivisions:  () => client.get('/locations/divisions'),
  getDistricts:  (divisionId) => client.get(`/locations/divisions/${divisionId}/districts`),
  getUpazilas:   (districtId) => client.get(`/locations/districts/${districtId}/upazilas`),
}