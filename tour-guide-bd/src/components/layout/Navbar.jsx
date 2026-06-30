import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Search, User, LogOut, Shield, Menu, X, Plus } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { authApi } from '../../api/auth.api'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
   const qc = useQueryClient() 
const roles = (user?.roles || []).map(r => r.toLowerCase())
const isAdmin = roles.includes('admin') || roles.includes('moderator')
  const handleLogout = async () => {
    try { await authApi.logout({ userId: user?.id }) } catch {}
    logout()
     qc.clear()
    toast.success('Logged out')
    navigate('/login')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (search.trim()) navigate(`/places?q=${encodeURIComponent(search.trim())}`)
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <MapPin size={20} className="text-primary-600" />
          <span className="font-bold text-primary-700 text-base tracking-tight">TourGuide BD</span>
        </Link>

        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search places…"
              className="input pl-9 py-1.5 text-sm h-9"
            />
          </div>
        </form>

        <div className="hidden sm:flex items-center gap-1 ml-auto">
          <Link to="/places" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
            Explore
          </Link>
          <Link to="/map" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
            Map
          </Link>
          <Link to="/trip-planner" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
            Trip Planner
          </Link>
           <Link to="/guides" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors">
            Tour Guides
          </Link>
         
          {isAuthenticated && (
            <Link to="/places/create" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1">
              <Plus size={14} /> Add Place
            </Link>

            
          )}

    
         {user?.roles?.includes('TourGuide') && (
         <Link to="/guide/dashboard" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1">Guide Dashboard</Link>
          )}

          {isAdmin && (
            <Link to="/admin" className="px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1">
              <Shield size={14} /> Admin
            </Link>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-1">
              <Link to="/profile" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <User size={18} />
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary py-1.5 text-sm">Log in</Link>
              <Link to="/register" className="btn-primary py-1.5 text-sm">Sign up</Link>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden ml-auto p-2 rounded-lg hover:bg-gray-100">
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search places…"
                className="input pl-9 py-1.5 text-sm h-9"
              />
            </div>
          </form>
          <Link to="/places" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Explore</Link>
          <Link to="/map" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Map</Link>
          <Link to="/trip-planner" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Trip Planner</Link>
          {isAuthenticated && (
            <Link to="/places/create" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2 flex items-center gap-1">
              <Plus size={14} /> Add Place
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Admin</Link>
          )}
          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Profile</Link>
              <Link to="/favourites" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Favourites</Link>
              <Link to="/checkins" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Check-ins</Link>
              <Link to="/visit-history" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Visit history</Link>
              <Link to="/saved-districts" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Saved districts</Link>
              <button onClick={handleLogout} className="text-sm text-red-500 py-2 text-left">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 py-2">Log in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="text-sm text-primary-600 py-2 font-medium">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}