import { OBDData, FaultCode, ServiceStation, VehicleInfo, CalendarEvent } from '../types'

// ============ 模拟车辆信息 ============
export const mockVehicle: VehicleInfo = {
  id: 'v_001',
  vin: 'LSV******E2******',
  plate: '京A·88888',
  brand: '特斯拉',
  model: 'Model Y 长续航版',
  year: 2024,
  fuelType: 'electric',
  mileage: 28500,
  nextMaintenanceDate: '2026-09-15',
  nextMaintenanceMileage: 30000,
}

// ============ 模拟OBD实时数据 ============
export function getMockOBDData(): OBDData {
  const now = new Date().toISOString()
  return {
    timestamp: now,
    engineRPM: 0, // 电动车为0
    speed: 0,
    coolantTemp: 38,
    fuelLevel: 62,
    batteryVoltage: 12.6,
    tirePressure: {
      frontLeft: 2.3,
      frontRight: 2.2,
      rearLeft: 1.9, // 偏低！
      rearRight: 2.1,
    },
    oilLife: 85,
    brakePadLife: {
      front: 42,
      rear: 55,
    },
    dtcCodes: ['P0420', 'C0035'], // 当前故障码
    engineLoad: 0,
    throttlePosition: 0,
  }
}

// ============ OBD故障码数据库 ============
export const faultCodeDB: Record<string, FaultCode> = {
  P0420: {
    code: 'P0420',
    category: 'emission',
    severity: 'warning',
    description: '催化转化器系统效率低于阈值（B1）',
    possibleCauses: ['三元催化转化器老化/失效', '氧传感器故障', '排气泄漏', '发动机失火导致催化器中毒'],
    suggestedActions: ['检查排气系统是否泄漏', '检查前后氧传感器数据', '如催化器失效需更换三元催化器'],
    estimatedRepairCost: { min: 2000, max: 8000 },
    urgentAction: false,
  },
  C0035: {
    code: 'C0035',
    category: 'abs',
    severity: 'warning',
    description: '左前轮速传感器电路故障',
    possibleCauses: ['轮速传感器损坏', '传感器线路短路/断路', 'ABS模块内部故障'],
    suggestedActions: ['检查左前轮速传感器线路连接', '用万用表测试传感器电阻', '必要时更换轮速传感器'],
    estimatedRepairCost: { min: 300, max: 1200 },
    urgentAction: false,
  },
  P0300: {
    code: 'P0300',
    category: 'engine',
    severity: 'critical',
    description: '检测到随机/多缸失火',
    possibleCauses: ['火花塞老化/损坏', '点火线圈故障', '燃油系统问题', '气缸压缩不足'],
    suggestedActions: ['立即停车检查', '检查火花塞和点火线圈', '检查燃油压力和喷油嘴'],
    estimatedRepairCost: { min: 500, max: 5000 },
    urgentAction: true,
  },
  P0171: {
    code: 'P0171',
    category: 'engine',
    severity: 'warning',
    description: '系统过稀（B1）',
    possibleCauses: ['进气系统泄漏', 'MAF传感器脏污', '燃油压力不足', '氧传感器故障'],
    suggestedActions: ['检查进气系统是否泄漏', '清洁或更换MAF传感器', '检查燃油滤清器和油泵'],
    estimatedRepairCost: { min: 200, max: 2000 },
    urgentAction: false,
  },
  P0700: {
    code: 'P0700',
    category: 'transmission',
    severity: 'critical',
    description: '变速箱控制系统故障',
    possibleCauses: ['变速箱控制模块故障', '变速箱油液不足或变质', '电磁阀故障', '内部机械故障'],
    suggestedActions: ['立即检查变速箱油液位和状态', '使用诊断仪读取TCM故障码', '必要时拖车至维修站'],
    estimatedRepairCost: { min: 1000, max: 20000 },
    urgentAction: true,
  },
  C0040: {
    code: 'C0040',
    category: 'brake',
    severity: 'critical',
    description: '制动液液位过低',
    possibleCauses: ['制动液泄漏', '刹车片过度磨损', '制动管路破损'],
    suggestedActions: ['立即检查制动液液位', '检查刹车系统是否泄漏', '检查刹车片磨损情况'],
    estimatedRepairCost: { min: 100, max: 3000 },
    urgentAction: true,
  },
  P0A7F: {
    code: 'P0A7F',
    category: 'battery',
    severity: 'warning',
    description: '高压电池组退化',
    possibleCauses: ['电池组长期深度放电', '电池老化', 'BMS系统校准偏差'],
    suggestedActions: ['进行电池健康度检测', '检查BMS系统数据', '必要时进行电池均衡或更换'],
    estimatedRepairCost: { min: 5000, max: 60000 },
    urgentAction: false,
  },
  B0010: {
    code: 'B0010',
    category: 'airbag',
    severity: 'critical',
    description: '驾驶员侧安全气囊电路电阻异常',
    possibleCauses: ['气囊时钟弹簧故障', '气囊模块故障', '线路接触不良'],
    suggestedActions: ['立即进行安全气囊系统检查', '检查螺旋电缆（时钟弹簧）'],
    estimatedRepairCost: { min: 800, max: 3000 },
    urgentAction: true,
  },
}

// ============ 模拟4S店/维修门店数据 ============
export const serviceStations: ServiceStation[] = [
  {
    id: 'st_001',
    name: '特斯拉北京亦庄服务中心',
    type: '4s',
    brand: '特斯拉',
    address: '北京市大兴区亦庄经济开发区荣华南路10号',
    location: { lat: 39.7923, lng: 116.5140 },
    distance: 8.5,
    rating: 4.8,
    phone: '010-8888-6666',
    workHours: '08:00-18:00',
    availableSlots: [
      { date: '2026-08-08', time: '09:00', bayCount: 2, technicianName: '张师傅', technicianLevel: 'master' },
      { date: '2026-08-08', time: '14:00', bayCount: 1, technicianName: '李师傅', technicianLevel: 'senior' },
      { date: '2026-08-09', time: '10:00', bayCount: 3, technicianName: '王师傅', technicianLevel: 'master' },
    ],
    services: ['常规保养', '故障诊断', '钣金喷漆', '电池检测', '软件升级'],
    amenities: ['WiFi', '休息区', '免费充电', '代步车服务'],
    isDoorToDoor: true,
    isOnsiteService: false,
  },
  {
    id: 'st_002',
    name: '途虎养车朝阳大悦城店',
    type: 'chain',
    brand: '途虎养车',
    address: '北京市朝阳区朝阳北路101号',
    location: { lat: 39.9245, lng: 116.5170 },
    distance: 12.3,
    rating: 4.5,
    phone: '010-6666-8888',
    workHours: '07:00-21:00',
    availableSlots: [
      { date: '2026-08-08', time: '08:00', bayCount: 4, technicianName: '赵师傅', technicianLevel: 'senior' },
      { date: '2026-08-08', time: '11:00', bayCount: 2, technicianName: '刘师傅', technicianLevel: 'master' },
      { date: '2026-08-08', time: '15:00', bayCount: 3, technicianName: '陈师傅', technicianLevel: 'junior' },
    ],
    services: ['轮胎更换', '刹车片更换', '机油更换', '空调滤芯', '四轮定位'],
    amenities: ['WiFi', '休息区', '免费洗车'],
    isDoorToDoor: false,
    isOnsiteService: true,
  },
  {
    id: 'st_003',
    name: '博世车联望京店',
    type: 'chain',
    brand: '博世车联',
    address: '北京市朝阳区望京西路8号',
    location: { lat: 39.9980, lng: 116.4760 },
    distance: 15.8,
    rating: 4.6,
    phone: '010-7777-9999',
    workHours: '08:30-19:00',
    availableSlots: [
      { date: '2026-08-09', time: '09:30', bayCount: 2, technicianName: '周师傅', technicianLevel: 'master' },
      { date: '2026-08-09', time: '13:00', bayCount: 2, technicianName: '吴师傅', technicianLevel: 'senior' },
    ],
    services: ['发动机维修', '变速箱保养', '电气系统检测', '底盘检测'],
    amenities: ['WiFi', '休息区', '咖啡吧'],
    isDoorToDoor: true,
    isOnsiteService: false,
  },
  {
    id: 'st_004',
    name: '京东养车海淀店',
    type: 'independent',
    brand: '京东养车',
    address: '北京市海淀区中关村南大街12号',
    location: { lat: 39.9820, lng: 116.3150 },
    distance: 18.2,
    rating: 4.3,
    phone: '010-5555-7777',
    workHours: '08:00-20:00',
    availableSlots: [
      { date: '2026-08-08', time: '10:00', bayCount: 5, technicianName: '郑师傅', technicianLevel: 'senior' },
      { date: '2026-08-08', time: '16:00', bayCount: 3, technicianName: '马师傅', technicianLevel: 'junior' },
      { date: '2026-08-09', time: '08:30', bayCount: 4, technicianName: '孙师傅', technicianLevel: 'master' },
    ],
    services: ['常规保养', '轮胎服务', '空调维修', '电路检修'],
    amenities: ['WiFi', '休息区'],
    isDoorToDoor: false,
    isOnsiteService: true,
  },
]

// ============ 模拟用户日程 ============
export const mockCalendar: CalendarEvent[] = [
  {
    id: 'cal_001',
    title: '周例会',
    startTime: '2026-08-08T09:00:00',
    endTime: '2026-08-08T10:00:00',
    location: '公司会议室A',
    type: 'meeting',
  },
  {
    id: 'cal_002',
    title: '出差去上海',
    startTime: '2026-08-10T07:00:00',
    endTime: '2026-08-12T18:00:00',
    location: '上海浦东',
    type: 'trip',
  },
  {
    id: 'cal_003',
    title: '孩子家长会',
    startTime: '2026-08-09T14:00:00',
    endTime: '2026-08-09T16:00:00',
    location: '北京第一小学',
    type: 'personal',
  },
]

// ============ 模拟历史维保记录 ============
export const mockMaintenanceHistory = [
  { date: '2026-06-15', mileage: 25000, type: '常规保养', items: ['空调滤芯更换', '轮胎换位', '刹车液检查'], cost: 680 },
  { date: '2026-03-20', mileage: 20000, type: '定期检查', items: ['电池健康度检测', '底盘检查', '软件升级'], cost: 0 },
  { date: '2025-12-10', mileage: 15000, type: '故障维修', items: ['更换左前轮速传感器', '系统重置'], cost: 850 },
  { date: '2025-09-05', mileage: 10000, type: '常规保养', items: ['空调滤芯更换', '刹车片检查', '轮胎检查'], cost: 420 },
]

// ============ 模拟充电站/加油站数据 ============
export const mockEnergyStations = {
  beijing_shanghai: [
    { name: '天津南服务区超充站', type: 'charge', distance: 120, brand: '特斯拉超充', price: 1.8, chargingPower: 250, availableChargers: 8 },
    { name: '沧州服务区超充站', type: 'charge', distance: 230, brand: '特斯拉超充', price: 1.8, chargingPower: 250, availableChargers: 6 },
    { name: '德州服务区充电站', type: 'charge', distance: 360, brand: '国家电网', price: 1.2, chargingPower: 120, availableChargers: 12 },
    { name: '济南服务区超充站', type: 'charge', distance: 480, brand: '特斯拉超充', price: 1.8, chargingPower: 250, availableChargers: 10 },
    { name: '泰安服务区充电站', type: 'charge', distance: 580, brand: '特来电', price: 1.5, chargingPower: 180, availableChargers: 8 },
    { name: '徐州服务区超充站', type: 'charge', distance: 730, brand: '特斯拉超充', price: 1.8, chargingPower: 250, availableChargers: 6 },
    { name: '南京服务区充电站', type: 'charge', distance: 880, brand: '国家电网', price: 1.2, chargingPower: 120, availableChargers: 16 },
    { name: '常州服务区超充站', type: 'charge', distance: 1020, brand: '特斯拉超充', price: 1.8, chargingPower: 250, availableChargers: 8 },
  ]
}

// ============ 模拟语音指令解析 ============
export interface VoiceCommand {
  raw: string
  intent: 'fault_alert' | 'trip_plan' | 'maintenance_query' | 'status_check' | 'appointment' | 'unknown'
  entities: Record<string, string>
  confidence: number
}

export function parseVoiceCommand(input: string): VoiceCommand {
  const lower = input.toLowerCase()

  // 故障告警意图
  if (lower.includes('故障灯') || lower.includes('报警') || lower.includes('异常') || lower.includes('亮了')) {
    return {
      raw: input,
      intent: 'fault_alert',
      entities: {
        type: lower.includes('发动机') ? 'engine' : lower.includes('刹车') ? 'brake' : lower.includes('电池') ? 'battery' : 'general',
        description: input,
      },
      confidence: 0.92,
    }
  }

  // 出行规划意图
  if (lower.includes('出差') || lower.includes('去') || lower.includes('上班') || lower.includes('回家') || lower.includes('导航')) {
    const destMatch = input.match(/去(.+)/)
    return {
      raw: input,
      intent: 'trip_plan',
      entities: {
        destination: destMatch ? destMatch[1].trim() : input,
        date: lower.includes('明天') ? 'tomorrow' : lower.includes('后天') ? 'day_after_tomorrow' : 'today',
      },
      confidence: 0.88,
    }
  }

  // 保养查询意图
  if (lower.includes('保养') || lower.includes('维修') || lower.includes('检查')) {
    return {
      raw: input,
      intent: 'maintenance_query',
      entities: {
        type: lower.includes('预约') ? 'appointment' : 'query',
        description: input,
      },
      confidence: 0.9,
    }
  }

  // 状态查询意图
  if (lower.includes('状态') || lower.includes('怎么样') || lower.includes('如何') || lower.includes('车况')) {
    return {
      raw: input,
      intent: 'status_check',
      entities: {
        target: 'vehicle_health',
      },
      confidence: 0.85,
    }
  }

  return {
    raw: input,
    intent: 'unknown',
    entities: {},
    confidence: 0.3,
  }
}
