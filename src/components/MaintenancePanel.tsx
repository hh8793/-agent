import { useState } from 'react'
import { Wrench, MapPin, Clock, Star, Phone, Package, CreditCard, ShieldCheck, Truck, Home } from 'lucide-react'
import { ServiceStation, PartInfo, MaintenanceOrder, TimeSlot } from '../types'
import { maintenanceAgent } from '../agents/MaintenanceAgent'
import { serviceStations } from '../data/mockData'

interface MaintenancePanelProps {
  faultCodes: string[]
  onOrderCreated: (order: MaintenanceOrder) => void
}

export default function MaintenancePanel({ faultCodes, onOrderCreated }: MaintenancePanelProps) {
  const [step, setStep] = useState<'stations' | 'estimate' | 'confirm' | 'done'>('stations')
  const [selectedStation, setSelectedStation] = useState<ServiceStation | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [stations] = useState<ServiceStation[]>(() => maintenanceAgent.queryStations(faultCodes))
  const [serviceType, setServiceType] = useState<'onsite' | 'door_to_door' | 'self_drive'>('self_drive')
  const [estimate, setEstimate] = useState<any>(null)

  const handleSelectStation = (station: ServiceStation) => {
    setSelectedStation(station)
    const est = maintenanceAgent.generateEstimate(faultCodes, station.id)
    setEstimate(est)
    setStep('estimate')
  }

  const handleConfirm = () => {
    if (!selectedStation || !selectedSlot) return
    const order = maintenanceAgent.createOrder({
      vehicleId: 'v_001',
      stationId: selectedStation.id,
      faultCodes,
      appointmentTime: `${selectedSlot.date}T${selectedSlot.time}:00`,
      serviceType,
    })
    maintenanceAgent.confirmOrder(order.id)
    onOrderCreated(order)
    setStep('done')
  }

  const handleReset = () => {
    setStep('stations')
    setSelectedStation(null)
    setSelectedSlot(null)
    setServiceType('self_drive')
    setEstimate(null)
  }

  return (
    <div className="space-y-6">
      {/* 步骤指示器 */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-center gap-2 mb-6">
          {['选择门店', '确认估价', '预约完成'].map((label, i) => {
            const currentStepIdx = step === 'done' ? 2 : step === 'stations' ? 0 : step === 'estimate' ? 1 : 2
            const isActive = i <= currentStepIdx
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive ? 'bg-primary-500 text-white' : 'bg-gray-700 text-gray-500'
                }`}>
                  {i + 1}
                </div>
                <span className={`text-xs ${isActive ? 'text-gray-200' : 'text-gray-600'}`}>{label}</span>
                {i < 2 && <div className={`w-8 h-0.5 ${i < currentStepIdx ? 'bg-primary-500' : 'bg-gray-700'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step 1: 选择门店 */}
      {(step === 'stations') && (
        <div className="space-y-4">
          <div className="flex gap-3 mb-4">
            {[
              { id: 'self_drive' as const, icon: CarIcon, label: '自行到店' },
              { id: 'door_to_door' as const, icon: Truck, label: '上门取送车' },
              { id: 'onsite' as const, icon: Home, label: '上门保养' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setServiceType(opt.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs transition-all ${
                  serviceType === opt.id
                    ? 'border-primary-500/50 bg-primary-500/10 text-primary-400'
                    : 'border-gray-700/50 text-gray-400 hover:border-gray-600'
                }`}
              >
                <opt.icon className="w-5 h-5" />
                {opt.label}
              </button>
            ))}
          </div>
          {stations.map(station => (
            <div
              key={station.id}
              onClick={() => handleSelectStation(station)}
              className="glass-card hover:border-primary-500/30 cursor-pointer transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{station.name}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      station.type === '4s' ? 'bg-primary-500/20 text-primary-400' :
                      station.type === 'chain' ? 'bg-accent-500/20 text-accent-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {station.type === '4s' ? '4S店' : station.type === 'chain' ? '连锁店' : '独立店'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{station.address}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Star className="w-3 h-3 text-warning-400" />{station.rating}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{station.workHours}</span>
                    <span>距您 {station.distance}km</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {station.services.slice(0, 4).map((s, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-700/50 text-gray-400 rounded">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="flex flex-col gap-1">
                    {station.isDoorToDoor && <span className="text-[10px] text-accent-400">✅ 上门取送</span>}
                    {station.isOnsiteService && <span className="text-[10px] text-primary-400">✅ 上门保养</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: 确认估价和时间 */}
      {(step === 'estimate' || step === 'confirm') && selectedStation && estimate && (
        <div className="space-y-4 animate-slide-up">
          {/* 门店和技师选择 */}
          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-4">选择预约时间 - {selectedStation.name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedStation.availableSlots.map((slot, i) => (
                <button
                  key={i}
                  onClick={() => { setSelectedSlot(slot); setStep('confirm') }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    selectedSlot === slot
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-gray-700/50 hover:border-primary-500/30'
                  }`}
                >
                  <p className="text-sm font-semibold">{slot.date} {slot.time}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    👨‍🔧 {slot.technicianName} · {slot.technicianLevel === 'master' ? '高级技师' : slot.technicianLevel === 'senior' ? '中级技师' : '初级技师'}
                  </p>
                  <p className="text-xs text-accent-400 mt-0.5">剩余工位：{slot.bayCount}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 估价单 */}
          <div className="glass-panel p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary-400" /> 维修估价单
            </h3>
            <div className="space-y-3">
              {/* 配件费用 */}
              <div>
                <p className="text-xs text-gray-500 mb-2">配件费用</p>
                {estimate.parts.map((part: PartInfo) => (
                  <div key={part.id} className="flex items-center justify-between py-2 border-b border-gray-700/20">
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-sm">{part.name}</p>
                        <p className="text-[10px] text-gray-500">OE: {part.oemNumber}</p>
                      </div>
                      {part.stock > 0 ? (
                        <span className="text-[10px] text-accent-400">库存{part.stock}件</span>
                      ) : (
                        <span className="text-[10px] text-warning-400">需调货 {part.deliveryDays}天</span>
                      )}
                    </div>
                    <span className="text-sm font-semibold">¥{part.price}</span>
                  </div>
                ))}
                {estimate.parts.length > 0 && (
                  <p className="text-right text-xs text-gray-500 mt-1">配件小计：¥{estimate.parts.reduce((s: number, p: PartInfo) => s + p.price, 0)}</p>
                )}
              </div>

              {/* 工时费用 */}
              <div className="flex items-center justify-between py-2 border-b border-gray-700/20">
                <span className="text-sm text-gray-400">工时费（预估{estimate.estimatedHours}小时）</span>
                <span className="text-sm font-semibold">¥{estimate.labor}</span>
              </div>

              {/* 服务类型附加费 */}
              {serviceType === 'door_to_door' && (
                <div className="flex items-center justify-between py-2 border-b border-gray-700/20">
                  <span className="text-sm text-gray-400">上门取送车服务费</span>
                  <span className="text-sm font-semibold">¥150</span>
                </div>
              )}
              {serviceType === 'onsite' && (
                <div className="flex items-center justify-between py-2 border-b border-gray-700/20">
                  <span className="text-sm text-gray-400">上门保养服务费</span>
                  <span className="text-sm font-semibold">¥200</span>
                </div>
              )}

              {/* 总计 */}
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold">预估总费用</span>
                <span className="text-xl font-bold text-primary-400">
                  ¥{estimate.total + (serviceType === 'door_to_door' ? 150 : serviceType === 'onsite' ? 200 : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* 确认按钮 */}
          {step === 'confirm' && selectedSlot && (
            <div className="glass-panel p-6 animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-6 h-6 text-accent-400" />
                <div>
                  <p className="font-semibold">确认预约信息</p>
                  <p className="text-xs text-gray-500">
                    {selectedStation.name} · {selectedSlot.date} {selectedSlot.time} · 技师：{selectedSlot.technicianName}
                    · {serviceType === 'door_to_door' ? '上门取送车' : serviceType === 'onsite' ? '上门保养' : '自行到店'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleReset} className="flex-1 btn-secondary">修改方案</button>
                <button onClick={handleConfirm} className="flex-1 btn-primary">确认预约</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 完成状态 */}
      {step === 'done' && (
        <div className="glass-panel p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-accent-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-accent-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">预约成功！</h3>
          <p className="text-gray-400 text-sm mb-6">
            {selectedStation?.name} · {selectedSlot?.date} {selectedSlot?.time}<br />
            已同步至您的日历，请按时前往
          </p>
          <button onClick={handleReset} className="btn-secondary">创建新预约</button>
        </div>
      )}
    </div>
  )
}

function CarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-5H5v5z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
      <path d="M5 8l2-3h10l2 3" />
    </svg>
  )
}
