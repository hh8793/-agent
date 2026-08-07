import { useState, useCallback } from 'react'
import { X, Bell } from 'lucide-react'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import VehicleHealthPanel from './components/VehicleHealthPanel'
import MaintenancePanel from './components/MaintenancePanel'
import TravelPanel from './components/TravelPanel'
import ServiceTracking from './components/ServiceTracking'
import { AgentMessage, MaintenanceOrder } from './types'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [notifications, setNotifications] = useState<AgentMessage[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [activeOrder, setActiveOrder] = useState<MaintenanceOrder | null>(null)
  const [travelDest, setTravelDest] = useState<string | undefined>(undefined)

  const addNotification = useCallback((msg: AgentMessage) => {
    setNotifications(prev => {
      if (prev.find(n => n.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const handleCreateOrder = (order: MaintenanceOrder) => {
    setActiveOrder(order)
    addNotification({
      id: `notif_order_${order.id}`,
      timestamp: new Date().toISOString(),
      from: 'maintenance',
      type: 'confirmation',
      content: `预约成功！工单号：${order.id}，请前往服务履约跟踪进度`,
      requiresAction: true,
      actionOptions: [{ id: 'go_service', label: '查看服务进度', type: 'primary', handler: 'GOTO_SERVICE' }],
    })
    setActiveTab('service')
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    // 解析tab中的目的地参数
    if (tab.startsWith('travel:')) {
      setTravelDest(tab.split(':')[1])
      setActiveTab('travel')
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            activeTab={activeTab}
            onTabChange={handleTabChange}
            addNotification={addNotification}
            onCreateOrder={handleCreateOrder}
          />
        )
      case 'health':
        return <VehicleHealthPanel />
      case 'maintenance':
        return <MaintenancePanel faultCodes={['P0420', 'C0035']} onOrderCreated={handleCreateOrder} />
      case 'travel':
        return <TravelPanel destination={travelDest} />
      case 'service':
        return <ServiceTracking order={activeOrder} />
      default:
        return <Dashboard activeTab={activeTab} onTabChange={handleTabChange} addNotification={addNotification} onCreateOrder={handleCreateOrder} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        notificationCount={notifications.length}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
      />

      {/* 通知面板 */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] z-40 glass-panel p-4 animate-slide-up max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" /> 通知 ({notifications.length})
            </h3>
            <button onClick={() => setNotifications([])} className="text-xs text-gray-500 hover:text-gray-300">
              清空全部
            </button>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">暂无通知</p>
          ) : (
            <div className="space-y-2">
              {notifications.map(notif => (
                <div key={notif.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-800/50">
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">
                      {notif.from === 'health' ? '车况监测' :
                       notif.from === 'maintenance' ? '维保调度' :
                       notif.from === 'travel' ? '出行规划' : '服务履约'}
                    </p>
                    <p className="text-sm">{notif.content}</p>
                  </div>
                  <button onClick={() => clearNotification(notif.id)} className="flex-shrink-0">
                    <X className="w-3 h-3 text-gray-600 hover:text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 主内容 */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        车联智护 Agent &copy; 2026 | 智能维保与动态出行规划系统 | 数据已脱敏处理
      </footer>
    </div>
  )
}
