import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Search, User, LogOut, Shield, Menu, X, Plus, Compass, Package, Wallet, Info, Mail } from 'lucide-react'
import { useState } from 'react'
import { useAuthStore } from '../../store/auth.store'
import { authApi } from '../../api/auth.api'
import { useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

var navLinkCls = 'px-3 py-1.5 text-sm text-gray-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-1'

export default function Navbar() {
  var auth = useAuthStore()
  var user = auth.user
  var isAuthenticated = auth.isAuthenticated
  var logout = auth.logout

  var [menuOpen, setMenuOpen] = useState(false)
  var [search, setSearch] = useState('')
  var navigate = useNavigate()
  var qc = useQueryClient()

  var roles = (user && user.roles ? user.roles : []).map(function(r) { return r.toLowerCase() })
  var isAdmin = roles.includes('admin') || roles.includes('moderator')
  var isGuide = roles.includes('tourguide')

  function handleLogout() {
    authApi.logout({ userId: user && user.id }).catch(function() {})
    logout()
    qc.clear()
    toast.success('Logged out')
    navigate('/login')
  }

  function handleSearch(e) {
    e.preventDefault()
    if (search.trim()) navigate('/places?q=' + encodeURIComponent(search.trim()))
  }

  function closeMenu() { setMenuOpen(false) }

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 shrink-0">
          <MapPin size={20} className="text-primary-600" />
          <span className="font-bold text-primary-700 text-base tracking-tight">TourGuide BD</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden sm:flex flex-1 max-w-sm items-center gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={function(e) { setSearch(e.target.value) }}
              placeholder="Search places…"
              className="input pl-9 py-1.5 text-sm h-9"
            />
          </div>
        </form>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-1 ml-auto">
          <Link to="/places" className={navLinkCls}>Explore</Link>
          <Link to="/map" className={navLinkCls}>Map</Link>
          <Link to="/trip-planner" className={navLinkCls}>Trip Planner</Link>

          {/* Guides — সবার জন্য */}
          <Link to="/guides" className={navLinkCls}>
            <Compass size={14} /> Guides
          </Link>

          {/* Public info pages — সবার জন্য */}
          <Link to="/about" className={navLinkCls}>
            <Info size={14} /> About
          </Link>
          <Link to="/contact" className={navLinkCls}>
            <Mail size={14} /> Contact
          </Link>

          {isAuthenticated && (
            <Link to="/places/create" className={navLinkCls}>
              <Plus size={14} /> Add Place
            </Link>
          )}

          {/* Guide links — শুধু TourGuide */}
          {isGuide && (
            <>
              <Link to="/guide/dashboard" className={navLinkCls}>
                <Wallet size={14} /> Dashboard
              </Link>
              <Link to="/guide/packages" className={navLinkCls}>
                <Package size={14} /> My Packages
              </Link>
            </>
          )}

          {/* Admin */}
          {isAdmin && (
            <Link to="/admin" className={navLinkCls}>
              <Shield size={14} /> Admin
            </Link>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-1 ml-1">
              <Link to="/profile" className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <User size={18} />
              </Link>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 ml-1">
              <Link to="/login" className="btn-secondary py-1.5 text-sm">Log in</Link>
              <Link to="/register" className="btn-primary py-1.5 text-sm">Sign up</Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={function() { setMenuOpen(function(o) { return !o }) }}
          className="sm:hidden ml-auto p-2 rounded-lg hover:bg-gray-100"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden px-4 pb-4 flex flex-col gap-2 border-t border-gray-100 bg-white">
          <form onSubmit={handleSearch} className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={function(e) { setSearch(e.target.value) }}
                placeholder="Search places…"
                className="input pl-9 py-1.5 text-sm h-9"
              />
            </div>
          </form>

          <Link to="/places" onClick={closeMenu} className="text-sm text-gray-700 py-2">Explore</Link>
          <Link to="/map" onClick={closeMenu} className="text-sm text-gray-700 py-2">Map</Link>
          <Link to="/trip-planner" onClick={closeMenu} className="text-sm text-gray-700 py-2">Trip Planner</Link>
          <Link to="/guides" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
            <Compass size={14} /> Guides
          </Link>
          <Link to="/about" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
            <Info size={14} /> About
          </Link>
          <Link to="/contact" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
            <Mail size={14} /> Contact
          </Link>

          {isAuthenticated && (
            <Link to="/places/create" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
              <Plus size={14} /> Add Place
            </Link>
          )}

          {isGuide && (
            <>
              <Link to="/guide/dashboard" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
                <Wallet size={14} /> Dashboard
              </Link>
              <Link to="/guide/packages" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
                <Package size={14} /> My Packages
              </Link>
            </>
          )}

          {isAdmin && (
            <Link to="/admin" onClick={closeMenu} className="text-sm text-gray-700 py-2 flex items-center gap-1">
              <Shield size={14} /> Admin
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link to="/profile" onClick={closeMenu} className="text-sm text-gray-700 py-2">Profile</Link>
              <Link to="/favourites" onClick={closeMenu} className="text-sm text-gray-700 py-2">Favourites</Link>
              <Link to="/checkins" onClick={closeMenu} className="text-sm text-gray-700 py-2">Check-ins</Link>
              <Link to="/visit-history" onClick={closeMenu} className="text-sm text-gray-700 py-2">Visit history</Link>
              <Link to="/saved-districts" onClick={closeMenu} className="text-sm text-gray-700 py-2">Saved districts</Link>
              <button onClick={handleLogout} className="text-sm text-red-500 py-2 text-left">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu} className="text-sm text-gray-700 py-2">Log in</Link>
              <Link to="/register" onClick={closeMenu} className="text-sm text-primary-600 py-2 font-medium">Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}