import { NavLink } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import {
  LayoutDashboard, Users, MapPin, Star,
  Flag, FileText, Radio, UserCheck
} from 'lucide-react'

const links = [
  { to: '/admin',                     label: 'Dashboard',          icon: LayoutDashboard, end: true },
  { to: '/admin/users',               label: 'Users',              icon: Users },
  { to: '/admin/places',              label: 'Pending places',     icon: MapPin },
  { to: '/admin/reviews',             label: 'Pending reviews',    icon: Star },
  { to: '/admin/guide-applications',  label: 'Guide applications', icon: UserCheck },
  { to: '/admin/guides',              label: 'Manage guides',      icon: Users },
  { to: '/admin/reports',             label: 'Reports',            icon: Flag },
  { to: '/admin/audit',               label: 'Audit logs',         icon: FileText },
  { to: '/admin/broadcast',           label: 'Broadcast',          icon: Radio },
  { to: '/admin/bookings', label: 'Bookings', icon: CreditCard },
  { to: '/admin/financial-dashboard', label: 'Financial Dashboard', icon: LayoutDashboard },
{ to: '/admin/withdrawals',         label: 'Withdrawals',         icon: CreditCard },
]

export default function Sidebar() {
  return (
    <aside className="w-52 shrink-0 hidden lg:block">
      <nav className="sticky top-20 space-y-1">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}