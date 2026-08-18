// ============ 共享类型定义 ============
export interface VehicleInfo {
  id: string
  vin: string
  plate: string
  brand: string
  model: string
  year: number
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid'
  mileage: number
  nextMaintenanceDate: string
  nextMaintenanceMileage: number
}

export interface OBDData {
  timestamp: string
  engineRPM: number
  speed: number
  coolantTemp: number
  fuelLevel: number
  batteryVoltage: number
  tirePressure: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number }
  oilLife: number
  brakePadLife: { front: number; rear: number }
  dtcCodes: string[]
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
  isDoorToDoor: boolean
  isOnsiteService: boolean
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
  estimatedDuration: number
  serviceType: 'onsite' | 'door_to_door' | 'self_drive'
  progress: number
  progressNotes: string[]
  paymentStatus: 'unpaid' | 'paid' | 'refunded'
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
  chargingPower?: number
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

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  endTime: string
  location?: string
  type: 'meeting' | 'trip' | 'personal' | 'maintenance'
}

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

export interface HealthReport {
  overallStatus: 'healthy' | 'attention' | 'critical'
  score: number
  issues: HealthIssue[]
  recommendations: string[]
  checkedAt: string
}

export interface HealthIssue {
  component: string
  severity: 'critical' | 'warning' | 'info'
  detail: string
  faultCode?: string
  remainingLife?: number
  suggestedAction: string
}

export interface VoiceCommand {
  raw: string
  intent: 'fault_alert' | 'trip_plan' | 'maintenance_query' | 'status_check' | 'appointment' | 'unknown'
  entities: Record<string, string>
  confidence: number
}
