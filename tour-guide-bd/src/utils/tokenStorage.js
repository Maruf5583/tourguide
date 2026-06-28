const ACCESS_KEY  = 'tgbd_access'
const REFRESH_KEY = 'tgbd_refresh'
const USER_KEY    = 'tgbd_user'

export const tokenStorage = {
  getAccess:      () => localStorage.getItem(ACCESS_KEY),
  setAccess:      (t) => localStorage.setItem(ACCESS_KEY, t),
  getRefresh:     () => localStorage.getItem(REFRESH_KEY),
  setRefresh:     (t) => localStorage.setItem(REFRESH_KEY, t),
  getUser:        () => JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
  setUser:        (u) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearAll:       () => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}