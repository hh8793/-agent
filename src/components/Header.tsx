import { useState } from 'react'
import { Car, MapPin, Wrench, ClipboardCheck, Bell, Menu, X, Zap } from 'lucide-react'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  notificationCount: number
  onNotificationClick: () => void
}

export default function Header({ activeTab, onTabChange, notificationCount, onNotificationClick }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const tabs = [
    { id: 'dashboard', label: '仪表盘', icon: Zap },
    { id: 'health', label: '车况监测', icon: Car },
    { id: 'maintenance', label: '维保调度', icon: Wrench },
    { id: 'travel', label: '出行规划', icon: MapPin },
    { id: 'service', label: '服务履约', icon: ClipboardCheck },
  ]

  return (
    <header className="sticky top-0 z-50 glass-panel rounded-none border-x-0 border-t-0">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-400 to-primary-200 bg-clip-text text-transparent">
              车联智护 Agent
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5">智能维保与动态出行规划系统</p>
          </div>
        </div>

        {/* Desktop Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Notifications */}
        <div className="flex items-center gap-3">
          <button onClick={onNotificationClick} className="relative p-2 rounded-lg hover:bg-gray-700/50 transition-colors">
            <Bell className="w-5 h-5 text-gray-400" />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-glow">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-700/50" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5 text-gray-400" /> : <Menu className="w-5 h-5 text-gray-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-gray-700/50 px-4 py-3 flex flex-col gap-1 animate-slide-up">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { onTabChange(tab.id); setMobileOpen(false) }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-primary-500/15 text-primary-400' : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      )}
    </header>
  )
}
