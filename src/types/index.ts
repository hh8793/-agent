// ============ 车辆与OBD数据类型 ============
export interface VehicleInfo {
  id: string
  vin: string // 脱敏后的VIN
  plate: string
  brand: string
  model: string
  year: number
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  mileage: number // 公里
  nextMaintenanceDate: string
  nextMaintenanceMileage: number
}

export interface OBDData {
  timestamp: string
  engineRPM: number
  speed: number
  coolantTemp: number
  fuelLevel: number // 百分比
  batteryVoltage: number
  tirePressure: {
    frontLeft: number
    frontRight: number
    rearLeft: number
    rearRight: number
  }
  oilLife: number // 剩余百分比
  brakePadLife: {
    front: number
    rear: number
  }
  dtcCodes: string[] // 故障码
  engineLoad: number
  throttlePosition: number
}

export interface FaultCode {
  code: string
  category: 'engine' | 'transmission' | 'brake' | 'airbag' | 'abs' | 'battery' | 'emission' | 'body'
  severity: 'critical' | 'warning' | 'info'
  description: string
  possibleCauses: string[]
  suggestedActions: string[]
  estimatedRepairCost: { min: number; max: number }
  urgentAction: boolean
}

// ============ 维保服务数据类型 ============
export interface ServiceStation {
  id: string
  name: string
  type: '4s' | 'chain' | 'independent'
  brand: string
  address: string
  location: { lat: number; lng: number }
  distance: number
  rating: number
  phone: string
  workHours: string
  availableSlots: TimeSlot[]
  services: string[]
  amenities: string[]
  isDoorToDoor: boolean // 是否支持上门取送车
  isOnsiteService: boolean // 是否支持上门保养
}

export interface TimeSlot {
  date: string
  time: string
  bayCount: number
  technicianName: string
  technicianLevel: 'junior' | 'senior' | 'master'
}

export interface PartInfo {
  id: string
  name: string
  oemNumber: string
  price: number
  stock: number
  deliveryDays: number
  compatible: boolean
}

export interface MaintenanceOrder {
  id: string
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  vehicleId: string
  stationId: string
  faultCodes: string[]
  diagnosis: string
  requiredParts: PartInfo[]
  laborCost: number
  totalEstimate: number
  appointmentTime: string
  estimatedDuration: number // 分钟
  serviceType: 'onsite' | 'door_to_door' | 'self_drive'
  progress: number // 0-100
  progressNotes: string[]
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
}

// ============ 出行规划数据类型 ============
export interface Destination {
  name: string
  address: string
  location: { lat: number; lng: number }
  type: 'work' | 'leisure' | 'business_trip' | 'home'
}

export interface RoutePlan {
  id: string
  routes: Route[]
  recommendedIndex: number
  totalDistance: number
  totalDuration: number
  totalToll: number
  fuelStops: EnergyStop[]
  chargeStops: EnergyStop[]
  restStops: RestStop[]
  departureTime: string
  arrivalTime: string
  weatherAlerts: WeatherAlert[]
}

export interface Route {
  name: string
  distance: number
  duration: number
  toll: number
  trafficLevel: 'smooth' | 'moderate' | 'heavy' | 'jam'
  roadTypes: string[]
  waypoints: Waypoint[]
}

export interface Waypoint {
  name: string
  location: { lat: number; lng: number }
  type: 'turn' | 'tollgate' | 'service_area' | 'destination'
}

export interface EnergyStop {
  name: string
  type: 'gas' | 'charge'
  address: string
  location: { lat: number; lng: number }
  distanceFromStart: number
  price: number
  brand: string
  chargingPower?: number // kW
  availableChargers?: number
}

export interface RestStop {
  name: string
  type: 'service_area' | 'restaurant' | 'hotel'
  distanceFromStart: number
  amenities: string[]
}

export interface WeatherAlert {
  type: string
  severity: 'info' | 'warning' | 'danger'
  description: string
  startTime: string
  endTime: string
}

// ============ 用户与日程 ============
export interface UserProfile {
  id: string
  name: string
  phone: string
  vehicle: VehicleInfo
  calendar: CalendarEvent[]
  preferences: {
    preferredStations: string[]
    avoidTolls: boolean
    maxDetourMinutes: number
    alertThreshold: 'strict' | 'normal' | 'relaxed'
  }
}

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  location?: string
  type: 'meeting' | 'trip' | 'personal' | 'maintenance'
}

// ============ Agent通信类型 ============
export interface AgentMessage {
  id: string
  timestamp: string
  from: 'user' | 'health' | 'maintenance' | 'travel' | 'fulfillment' | 'system'
  type: 'alert' | 'suggestion' | 'confirmation' | 'status' | 'completion'
  content: string
  data?: any
  requiresAction: boolean
  actionOptions?: ActionOption[]
}

export interface ActionOption {
  id: string
  label: string
  type: 'primary' | 'secondary' | 'danger'
  handler: string
}
