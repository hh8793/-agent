import { useState } from 'react'
import { MapPin, Navigation, Battery, Zap, Clock, Car, Coffee, AlertTriangle, CheckCircle, Route } from 'lucide-react'
import { RoutePlan } from '../types'
import { travelPlannerAgent } from '../agents/TravelPlannerAgent'

interface TravelPanelProps {
  destination?: string
}

export default function TravelPanel({ destination: initialDest }: TravelPanelProps) {
  const [origin, setOrigin] = useState('北京')
  const [destination, setDestination] = useState(initialDest || '上海')
  const [departureDate, setDepartureDate] = useState('2026-08-10')
  const [plan, setPlan] = useState<RoutePlan | null>(null)
  const [selectedRoute, setSelectedRoute] = useState(0)
  const [showChecklist, setShowChecklist] = useState(false)
  const [planning, setPlanning] = useState(false)

  const handlePlan = () => {
    setPlanning(true)
    setTimeout(() => {
      const result = travelPlannerAgent.planTrip(origin, destination, departureDate)
      setPlan(result)
      setShowChecklist(false)
      setPlanning(false)
    }, 800)
  }

  const checklist = plan ? travelPlannerAgent.getPreTripChecklist(plan.totalDistance) : []

  return (
    <div className="space-y-6">
      {/* 路线规划输入 */}
      <div className="glass-panel p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Navigation className="w-5 h-5 text-primary-400" /> 出行路线规划
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">出发地</label>
            <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700/50 rounded-xl px-3 py-2.5">
              <MapPin className="w-4 h-4 text-accent-400 flex-shrink-0" />
              <input
                type="text" value={origin} onChange={e => setOrigin(e.target.value)}
                className="bg-transparent text-sm flex-1 focus:outline-none placeholder-gray-600"
                placeholder="出发地"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">目的地</label>
            <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700/50 rounded-xl px-3 py-2.5">
              <MapPin className="w-4 h-4 text-danger-400 flex-shrink-0" />
              <input
                type="text" value={destination} onChange={e => setDestination(e.target.value)}
                className="bg-transparent text-sm flex-1 focus:outline-none placeholder-gray-600"
                placeholder="目的地"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">出发日期</label>
            <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-700/50 rounded-xl px-3 py-2.5">
              <Clock className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <input
                type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)}
                className="bg-transparent text-sm flex-1 focus:outline-none"
              />
            </div>
          </div>
        </div>
        <button
          onClick={handlePlan}
          disabled={planning}
          className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
        >
          {planning ? (
            <><span className="animate-pulse">正在规划路线...</span></>
          ) : (
            <><Route className="w-4 h-4" /> 开始规划</>
          )}
        </button>
      </div>

      {/* 路线方案 */}
      {plan && (
        <div className="space-y-6 animate-slide-up">
          {/* 路线选择 */}
          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-4">路线方案</h3>
            <div className="space-y-3">
              {plan.routes.map((route, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedRoute(i)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    selectedRoute === i
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700/50 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">{route.name}</span>
                        {i === plan.recommendedIndex && (
                          <span className="badge-success text-[10px]">推荐</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{route.distance}km</span>
                        <span>{Math.floor(route.duration / 60)}h{route.duration % 60}min</span>
                        <span>通行费 ¥{route.toll}</span>
                        <span className={`${
                          route.trafficLevel === 'smooth' ? 'text-accent-400' :
                          route.trafficLevel === 'moderate' ? 'text-warning-400' :
                          route.trafficLevel === 'heavy' ? 'text-danger-400' : 'text-danger-500'
                        }`}>
                          {route.trafficLevel === 'smooth' ? '畅通' :
                           route.trafficLevel === 'moderate' ? '缓行' :
                           route.trafficLevel === 'heavy' ? '拥堵' : '严重拥堵'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 行程概览 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card flex items-center gap-3">
              <div className="p-2.5 bg-primary-500/10 rounded-lg">
                <Navigation className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">总里程</p>
                <p className="text-lg font-bold">{plan.totalDistance}<span className="text-xs font-normal text-gray-500"> km</span></p>
              </div>
            </div>
            <div className="glass-card flex items-center gap-3">
              <div className="p-2.5 bg-accent-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-accent-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">预计用时</p>
                <p className="text-lg font-bold">{Math.floor(plan.totalDuration / 60)}h{plan.totalDuration % 60}<span className="text-xs font-normal text-gray-500">min</span></p>
              </div>
            </div>
            <div className="glass-card flex items-center gap-3">
              <div className="p-2.5 bg-warning-500/10 rounded-lg">
                <Battery className="w-5 h-5 text-warning-400" />
              </div>
              <div>
                <p className="text-[10px] text-gray-500">沿途补能站</p>
                <p className="text-lg font-bold">{plan.chargeStops.length}<span className="text-xs font-normal text-gray-500"> 个充电站</span></p>
              </div>
            </div>
          </div>

          {/* 充电站点 */}
          {plan.chargeStops.length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning-400" /> 沿途充电规划
              </h3>
              <div className="space-y-3">
                {plan.chargeStops.map((stop, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-900/40 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent-500/10 rounded-lg flex items-center justify-center text-xs font-bold text-accent-400">
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{stop.name}</p>
                        <p className="text-xs text-gray-500">
                          {stop.distanceFromStart}km处 · {stop.brand}
                          {stop.chargingPower && ` · ${stop.chargingPower}kW`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-accent-400">¥{stop.price}/度</p>
                      <p className="text-xs text-gray-500">空闲 {stop.availableChargers} 桩</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 休息点 */}
          {plan.restStops.length > 0 && (
            <div className="glass-panel p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-primary-400" /> 休息点推荐
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {plan.restStops.map((stop, i) => (
                  <div key={i} className="glass-card">
                    <p className="text-sm font-semibold mb-2">{stop.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{stop.distanceFromStart}km处</p>
                    <div className="flex flex-wrap gap-1">
                      {stop.amenities.map((a, j) => (
                        <span key={j} className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">{a}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 天气预警 */}
          {plan.weatherAlerts.length > 0 && (
            <div className="glass-panel p-4 border-warning-500/30 bg-warning-500/5">
              {plan.weatherAlerts.map((alert, i) => (
                <div key={i} className="flex items-start gap-3">
                  <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    alert.severity === 'danger' ? 'text-danger-400' : alert.severity === 'warning' ? 'text-warning-400' : 'text-primary-400'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{alert.type}预警</p>
                    <p className="text-xs text-gray-400">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 出发前自检清单 */}
          <div className="glass-panel p-6">
            <button
              onClick={() => setShowChecklist(!showChecklist)}
              className="w-full flex items-center justify-between"
            >
              <span className="font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent-400" /> 出发前自检清单
              </span>
              <span className="text-xs text-gray-500">{showChecklist ? '收起' : '展开'}</span>
            </button>
            {showChecklist && (
              <div className="mt-4 space-y-2 animate-slide-up">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                    <span className={item.startsWith('⚠') ? 'text-warning-400' : 'text-gray-300'}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
