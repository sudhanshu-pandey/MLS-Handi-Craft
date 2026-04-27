import { NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ChartBarIcon,
  TagIcon,
  PhotoIcon,
  TicketIcon,
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline'
import { useAppDispatch, useAppSelector } from '../redux/hooks'
import { toggleSidebar } from '../redux/slices/uiSlice'
import { logout } from '../redux/slices/authSlice'

const NAV_ITEMS = [
  { to: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { to: '/products', icon: ShoppingBagIcon, label: 'Products' },
  { to: '/orders', icon: ClipboardDocumentListIcon, label: 'Orders' },
  { to: '/users', icon: UsersIcon, label: 'Users' },
  { to: '/analytics', icon: ChartBarIcon, label: 'Analytics' },
  { to: '/categories', icon: TagIcon, label: 'Categories' },
  { to: '/banners', icon: PhotoIcon, label: 'Banners' },
  { to: '/coupons', icon: TicketIcon, label: 'Coupons' },
]

export default function Sidebar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { sidebarCollapsed } = useAppSelector(s => s.ui)
  const { user } = useAppSelector(s => s.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: '#2a2d3e' }}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm">HC</div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">HandiCraft</p>
              <p className="text-gray-400 text-xs">Admin Panel</p>
            </div>
          </div>
        )}
        {sidebarCollapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold text-sm mx-auto">HC</div>
        )}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="hidden lg:flex items-center justify-center w-6 h-6 rounded text-gray-400 hover:text-white transition-colors ml-auto"
        >
          {sidebarCollapsed ? <ChevronRightIcon className="w-4 h-4" /> : <ChevronLeftIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              sidebar-item group relative
              ${isActive
                ? 'text-white font-semibold'
                : 'text-gray-400 hover:text-white'
              }
            `}
            style={({ isActive }) => ({
              backgroundColor: isActive ? '#2d3154' : 'transparent',
            })}
            onMouseEnter={e => {
              if (!(e.currentTarget as HTMLElement).classList.contains('active')) {
                ;(e.currentTarget as HTMLElement).style.backgroundColor = '#252840'
              }
            }}
            onMouseLeave={e => {
              const isActive = e.currentTarget.getAttribute('aria-current') === 'page'
              ;(e.currentTarget as HTMLElement).style.backgroundColor = isActive ? '#2d3154' : 'transparent'
            }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

            {/* Tooltip for collapsed */}
            {sidebarCollapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-2 py-3 border-t" style={{ borderColor: '#2a2d3e' }}>
        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg" style={{ backgroundColor: '#252840' }}>
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-gray-400 text-xs truncate capitalize">{user?.role || 'admin'}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-gray-400 hover:text-red-400"
          style={{ backgroundColor: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#252840' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
        >
          <ArrowLeftOnRectangleIcon className="w-5 h-5 flex-shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
