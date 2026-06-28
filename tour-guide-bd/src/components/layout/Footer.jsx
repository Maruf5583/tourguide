import { Link } from 'react-router-dom'
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={22} className="text-primary-400" />
              <span className="font-black text-white text-lg">TourGuide BD</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Discover the beauty of Bangladesh — from the world's longest beach to the mystic Sundarbans.
            </p>
            <div className="flex gap-3">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a key={i} href="#"
                  className="w-9 h-9 bg-gray-800 hover:bg-primary-600 rounded-xl flex items-center justify-center transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* explore */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Explore</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/places', label: 'All places' },
                { to: '/places?category=1', label: 'Beaches' },
                { to: '/places?category=2', label: 'Hills' },
                { to: '/places?category=4', label: 'Historical' },
                { to: '/map', label: 'Map view' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-primary-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* plan */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Plan</h3>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/trip-planner', label: 'Trip planner' },
                { to: '/trip-planner/build', label: 'Build itinerary' },
                { to: '/places/create', label: 'Add a place' },
                { to: '/profile', label: 'My profile' },
                { to: '/favourites', label: 'Favourites' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="hover:text-primary-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-primary-400 shrink-0" />
                <span>hello@tourguidebd.com</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-primary-400 shrink-0" />
                <span>+880 1700-000000</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={14} className="text-primary-400 shrink-0" />
                <span>Dhaka, Bangladesh</span>
              </li>
            </ul>
          </div>
        </div>

        {/* divider + bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>© 2026 TourGuide BD. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-300 transition-colors">About</a>
          </div>
        </div>
      </div>
    </footer>
  )
}