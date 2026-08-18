import { store } from './store.js'
import type { VehicleInfo, FaultCode, ServiceStation, PartInfo, CalendarEvent, OBDData } from '../types.js'

// ============ 种子数据 ============
export function seedDatabase() {
  if (store.count('vehicles') > 0) return

  // 车辆信息
  const vehicle: VehicleInfo = {
    id: 'v_001', vin: 'LSV******E2******', plate: '京A·88888', brand: '特斯拉',
    model: 'Model Y 长续航版', year: 2024, fuelType: 'electric', mileage: 28500,
    nextMaintenanceDate: '2026-09-15', nextMaintenanceMileage: 30000,
  }
  store.insert('vehicles', vehicle)

  // OBD 数据
  const obdData: OBDData = {
    timestamp: new Date().toISOString(), engineRPM: 0, speed: 0, coolantTemp: 38,
    fuelLevel: 62, batteryVoltage: 12.6,
    tirePressure: { frontLeft: 2.3, frontRight: 2.2, rearLeft: 1.9, rearRight: 2.1 },
    oilLife: 85, brakePadLife: { front: 42, rear: 55 },
    dtcCodes: ['P0420', 'C0035'], engineLoad: 0, throttlePosition: 0,
  }
  store.insert('obd_data', { vehicle_id: 'v_001', ...obdData })

  // 故障码库
  const faultCodes: FaultCode[] = [
    { code: 'P0420', category: 'emission', severity: 'warning', description: '催化转化器系统效率低于阈值（B1）', possibleCauses: ['三元催化转化器老化/失效', '氧传感器故障', '排气泄漏', '发动机失火导致催化器中毒'], suggestedActions: ['检查排气系统是否泄漏', '检查前后氧传感器数据', '如催化器失效需更换三元催化器'], estimatedRepairCost: { min: 2000, max: 8000 }, urgentAction: false },
    { code: 'C0035', category: 'abs', severity: 'warning', description: '左前轮速传感器电路故障', possibleCauses: ['轮速传感器损坏', '传感器线路短路/断路', 'ABS模块内部故障'], suggestedActions: ['检查左前轮速传感器线路连接', '用万用表测试传感器电阻', '必要时更换轮速传感器'], estimatedRepairCost: { min: 300, max: 1200 }, urgentAction: false },
    { code: 'P0300', category: 'engine', severity: 'critical', description: '检测到随机/多缸失火', possibleCauses: ['火花塞老化/损坏', '点火线圈故障', '燃油系统问题', '气缸压缩不足'], suggestedActions: ['立即停车检查', '检查火花塞和点火线圈', '检查燃油压力和喷油嘴'], estimatedRepairCost: { min: 500, max: 5000 }, urgentAction: true },
    { code: 'P0171', category: 'engine', severity: 'warning', description: '系统过稀（B1）', possibleCauses: ['进气系统泄漏', 'MAF传感器脏污', '燃油压力不足', '氧传感器故障'], suggestedActions: ['检查进气系统是否泄漏', '清洁或更换MAF传感器', '检查燃油滤清器和油泵'], estimatedRepairCost: { min: 200, max: 2000 }, urgentAction: false },
    { code: 'P0700', category: 'transmission', severity: 'critical', description: '变速箱控制系统故障', possibleCauses: ['变速箱控制模块故障', '变速箱油液不足或变质', '电磁阀故障', '内部机械故障'], suggestedActions: ['立即检查变速箱油液位和状态', '使用诊断仪读取TCM故障码', '必要时拖车至维修站'], estimatedRepairCost: { min: 1000, max: 20000 }, urgentAction: true },
    { code: 'C0040', category: 'brake', severity: 'critical', description: '制动液液位过低', possibleCauses: ['制动液泄漏', '刹车片过度磨损', '制动管路破损'], suggestedActions: ['立即检查制动液液位', '检查刹车系统是否泄漏', '检查刹车片磨损情况'], estimatedRepairCost: { min: 100, max: 3000 }, urgentAction: true },
    { code: 'P0A7F', category: 'battery', severity: 'warning', description: '高压电池组退化', possibleCauses: ['电池组长期深度放电', '电池老化', 'BMS系统校准偏差'], suggestedActions: ['进行电池健康度检测', '检查BMS系统数据', '必要时进行电池均衡或更换'], estimatedRepairCost: { min: 5000, max: 60000 }, urgentAction: false },
    { code: 'B0010', category: 'airbag', severity: 'critical', description: '驾驶员侧安全气囊电路电阻异常', possibleCauses: ['气囊时钟弹簧故障', '气囊模块故障', '线路接触不良'], suggestedActions: ['立即进行安全气囊系统检查', '检查螺旋电缆（时钟弹簧）'], estimatedRepairCost: { min: 800, max: 3000 }, urgentAction: true },
  ]
  for (const fc of faultCodes) {
    store.insert('fault_codes', fc)
  }

  // 门店
  const stations: ServiceStation[] = [
    { id: 'st_001', name: '特斯拉北京亦庄服务中心', type: '4s', brand: '特斯拉', address: '北京市大兴区亦庄经济开发区荣华南路10号', location: { lat: 39.7923, lng: 116.5140 }, distance: 8.5, rating: 4.8, phone: '010-8888-6666', workHours: '08:00-18:00', availableSlots: [{ date: '2026-08-19', time: '09:00', bayCount: 2, technicianName: '张师傅', technicianLevel: 'master' }, { date: '2026-08-19', time: '14:00', bayCount: 1, technicianName: '李师傅', technicianLevel: 'senior' }, { date: '2026-08-20', time: '10:00', bayCount: 3, technicianName: '王师傅', technicianLevel: 'master' }], services: ['常规保养', '故障诊断', '钣金喷漆', '电池检测', '软件升级'], amenities: ['WiFi', '休息区', '免费充电', '代步车服务'], isDoorToDoor: true, isOnsiteService: false },
    { id: 'st_002', name: '途虎养车朝阳大悦城店', type: 'chain', brand: '途虎养车', address: '北京市朝阳区朝阳北路101号', location: { lat: 39.9245, lng: 116.5170 }, distance: 12.3, rating: 4.5, phone: '010-6666-8888', workHours: '07:00-21:00', availableSlots: [{ date: '2026-08-19', time: '08:00', bayCount: 4, technicianName: '赵师傅', technicianLevel: 'senior' }, { date: '2026-08-19', time: '11:00', bayCount: 2, technicianName: '刘师傅', technicianLevel: 'master' }, { date: '2026-08-19', time: '15:00', bayCount: 3, technicianName: '陈师傅', technicianLevel: 'junior' }], services: ['轮胎更换', '刹车片更换', '机油更换', '空调滤芯', '四轮定位'], amenities: ['WiFi', '休息区', '免费洗车'], isDoorToDoor: false, isOnsiteService: true },
    { id: 'st_003', name: '博世车联望京店', type: 'chain', brand: '博世车联', address: '北京市朝阳区望京西路8号', location: { lat: 39.9980, lng: 116.4760 }, distance: 15.8, rating: 4.6, phone: '010-7777-9999', workHours: '08:30-19:00', availableSlots: [{ date: '2026-08-20', time: '09:30', bayCount: 2, technicianName: '周师傅', technicianLevel: 'master' }, { date: '2026-08-20', time: '13:00', bayCount: 2, technicianName: '吴师傅', technicianLevel: 'senior' }], services: ['发动机维修', '变速箱保养', '电气系统检测', '底盘检测'], amenities: ['WiFi', '休息区', '咖啡吧'], isDoorToDoor: true, isOnsiteService: false },
    { id: 'st_004', name: '京东养车海淀店', type: 'independent', brand: '京东养车', address: '北京市海淀区中关村南大街12号', location: { lat: 39.9820, lng: 116.3150 }, distance: 18.2, rating: 4.3, phone: '010-5555-7777', workHours: '08:00-20:00', availableSlots: [{ date: '2026-08-19', time: '10:00', bayCount: 5, technicianName: '郑师傅', technicianLevel: 'senior' }, { date: '2026-08-19', time: '16:00', bayCount: 3, technicianName: '马师傅', technicianLevel: 'junior' }, { date: '2026-08-20', time: '08:30', bayCount: 4, technicianName: '孙师傅', technicianLevel: 'master' }], services: ['常规保养', '轮胎服务', '空调维修', '电路检修'], amenities: ['WiFi', '休息区'], isDoorToDoor: false, isOnsiteService: true },
  ]
  for (const s of stations) {
    store.insert('service_stations', s)
  }

  // 配件
  const parts: PartInfo[] = [
    { id: 'part_001', name: '前刹车片（陶瓷）', oemNumber: '800361-01', price: 680, stock: 8, deliveryDays: 0, compatible: true },
    { id: 'part_002', name: '后刹车片（陶瓷）', oemNumber: '800362-01', price: 520, stock: 5, deliveryDays: 0, compatible: true },
    { id: 'part_003', name: '左前轮速传感器', oemNumber: '1044422-00', price: 280, stock: 2, deliveryDays: 1, compatible: true },
    { id: 'part_004', name: '氧传感器（前）', oemNumber: '1034567-01', price: 450, stock: 0, deliveryDays: 3, compatible: true },
    { id: 'part_005', name: '三元催化转化器总成', oemNumber: '1089678-00', price: 5500, stock: 1, deliveryDays: 2, compatible: true },
    { id: 'part_006', name: '机油滤清器', oemNumber: '1102540-01', price: 80, stock: 20, deliveryDays: 0, compatible: true },
    { id: 'part_007', name: '全合成机油 5W-30', oemNumber: 'OIL530-4L', price: 380, stock: 15, deliveryDays: 0, compatible: true },
    { id: 'part_008', name: '空调滤芯', oemNumber: '1102601-00', price: 120, stock: 30, deliveryDays: 0, compatible: true },
  ]
  for (const p of parts) {
    store.insert('parts', p)
  }

  // 日历事件
  const events: CalendarEvent[] = [
    { id: 'cal_001', title: '周例会', startTime: '2026-08-19T09:00:00', endTime: '2026-08-19T10:00:00', location: '公司会议室A', type: 'meeting' },
    { id: 'cal_002', title: '出差去上海', startTime: '2026-08-20T07:00:00', endTime: '2026-08-22T18:00:00', location: '上海浦东', type: 'trip' },
    { id: 'cal_003', title: '孩子家长会', startTime: '2026-08-20T14:00:00', endTime: '2026-08-20T16:00:00', location: '北京第一小学', type: 'personal' },
  ]
  for (const e of events) {
    store.insert('calendar_events', e)
  }

  // 维保历史
  const history = [
    { vehicle_id: 'v_001', date: '2026-06-15', mileage: 25000, type: '常规保养', items: ['空调滤芯更换', '轮胎换位', '刹车液检查'], cost: 680 },
    { vehicle_id: 'v_001', date: '2026-03-20', mileage: 20000, type: '定期检查', items: ['电池健康度检测', '底盘检查', '软件升级'], cost: 0 },
    { vehicle_id: 'v_001', date: '2025-12-10', mileage: 15000, type: '故障维修', items: ['更换左前轮速传感器', '系统重置'], cost: 850 },
    { vehicle_id: 'v_001', date: '2025-09-05', mileage: 10000, type: '常规保养', items: ['空调滤芯更换', '刹车片检查', '轮胎检查'], cost: 420 },
  ]
  for (const h of history) {
    store.insert('maintenance_history', { ...h, items_json: JSON.stringify(h.items) })
  }

  console.log('[DB] 种子数据已插入')
}

// ============ 数据访问辅助函数 ============
export function getVehicle(id: string): VehicleInfo | null {
  return store.getById<VehicleInfo>('vehicles', id)
}

export function getAllVehicles(): VehicleInfo[] {
  return store.getAll<VehicleInfo>('vehicles')
}

export function getLatestOBD(vehicleId: string): OBDData | null {
  const records = store.getAll<any>('obd_data').filter(r => r.vehicle_id === vehicleId)
  if (records.length === 0) return null
  const latest = records[records.length - 1]
  const { vehicle_id, ...obd } = latest
  return obd as OBDData
}

export function insertOBD(vehicleId: string, data: OBDData): void {
  store.insert('obd_data', { vehicle_id: vehicleId, ...data })
}

export function getAllFaultCodes(): FaultCode[] {
  return store.getAll<FaultCode>('fault_codes')
}

export function getFaultCode(code: string): FaultCode | null {
  return store.getAll<FaultCode>('fault_codes').find(f => f.code === code) || null
}

export function getAllStations(): ServiceStation[] {
  return store.getAll<ServiceStation>('service_stations')
}

export function getStation(id: string): ServiceStation | null {
  return store.getById<ServiceStation>('service_stations', id)
}

export function getAllParts(): PartInfo[] {
  return store.getAll<PartInfo>('parts')
}

export function getMaintenanceHistory(vehicleId: string): any[] {
  return store.getAll<any>('maintenance_history').filter(r => r.vehicle_id === vehicleId)
}

export function getAllOrders(): any[] {
  return store.getAll<any>('maintenance_orders')
}

export function getOrder(id: string): any | null {
  return store.getById<any>('maintenance_orders', id)
}

export function insertOrder(order: any): void {
  store.insert('maintenance_orders', order)
}

export function updateOrder(id: string, updates: Record<string, any>): any | null {
  return store.update('maintenance_orders', id, updates)
}

export function getCalendarEvents(): CalendarEvent[] {
  return store.getAll<CalendarEvent>('calendar_events')
}

export function insertCalendarEvent(event: CalendarEvent): void {
  store.insert('calendar_events', event)
}

export function getHealthReports(vehicleId: string): any[] {
  return store.getAll<any>('health_reports').filter(r => r.vehicle_id === vehicleId)
}

export function insertHealthReport(report: any): void {
  store.insert('health_reports', report)
}

export function insertPaymentRecord(record: any): void {
  store.insert('payment_records', record)
}

export function getPaymentRecord(orderId: string): any | null {
  const records = store.getAll<any>('payment_records').filter(r => r.order_id === orderId)
  return records.length > 0 ? records[records.length - 1] : null
}
