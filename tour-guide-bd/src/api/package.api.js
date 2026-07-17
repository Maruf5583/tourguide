import client from './client'

export const packageApi = {
  // Guide-এর নিজের packages list
  getMyPackages: () =>
    client.get('/guide/my-packages'),

  // Package create
  create: (payload) =>
    client.post('/guide/packages', payload),

  // Package update
  update: (packageId, payload) =>
    client.put('/guide/packages/' + packageId, payload),

  // Package delete (soft delete)
  remove: (packageId) =>
    client.delete('/guide/packages/' + packageId),
}