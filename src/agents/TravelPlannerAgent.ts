/**
 * 出行规划 Agent —— 结合实时路况、电量/油量、目的地充电设施，生成最优路径
 */
import { Destination, RoutePlan, Route, EnergyStop, RestStop, WeatherAlert, AgentMessage } from '../types'
import { mockEnergyStations } from '../data/mockData'

// 模拟路线库
const routeTemplates: Record<string, { routes: Route[]; fuelStops: EnergyStop[]; chargeStops: EnergyStop[]; restStops: RestStop[] }> = {
  '北京-上海': {
    routes: [
      {
        name: '京沪高速（推荐）',
        distance: 1218,
        duration: 540, // 分钟
        toll: 480,
        trafficLevel: 'moderate',
        roadTypes: ['高速'],
        waypoints: [
          { name: '北京出发', location: { lat: 39.9042, lng: 116.4074 }, type: 'destination' },
          { name: '天津枢纽', location: { lat: 39.3434, lng: 117.3616 }, type: 'turn' },
          { name: '济南服务区', location: { lat: 36.6512, lng: 117.1201 }, type: 'service_area' },
          { name: '南京长江大桥', location: { lat: 32.1153, lng: 118.7387 }, type: 'turn' },
          { name: '上海到达', location: { lat: 31.2304, lng: 121.4737 }, type: 'destination' },
        ],
      },
      {
        name: '京台+沈海高速（备选）',
        distance: 1350,
        duration: 620,
        toll: 520,
        trafficLevel: 'smooth',
        roadTypes: ['高速'],
        waypoints: [
          { name: '北京出发', location: { lat: 39.9042, lng: 116.4074 }, type: 'destination' },
          { name: '廊坊', location: { lat: 39.5380, lng: 116.6838 }, type: 'turn' },
          { name: '沧州服务区', location: { lat: 38.3045, lng: 116.8388 }, type: 'service_area' },
          { name: '上海到达', location: { lat: 31.2304, lng: 121.4737 }, type: 'destination' },
        ],
      },
    ],
    fuelStops: [],
    chargeStops: mockEnergyStations.beijing_shanghai.filter(s => s.type === 'charge') as EnergyStop[],
    restStops: [
      { name: '济南服务区', type: 'service_area', distanceFromStart: 400, amenities: ['餐饮', '加油', '充电', '卫生间'] },
      { name: '徐州服务区', type: 'service_area', distanceFromStart: 700, amenities: ['餐饮', '住宿', '加油', '充电', '卫生间'] },
      { name: '南京服务区', type: 'service_area', distanceFromStart: 900, amenities: ['餐饮', '加油', '充电', '卫生间', '超市'] },
    ],
  },
}

export class TravelPlannerAgent {
  private currentBattery: number = 62 // 百分比
  private maxRange: number = 525 // 满电续航(km)
  private avgConsumption: number = 16.5 // kWh/100km

  setVehicleStatus(batteryLevel: number, maxRange: number): void {
    this.currentBattery = batteryLevel
    this.maxRange = maxRange
  }

  /** 规划出行路线 */
  planTrip(origin: string, destination: string, departureDate: string): RoutePlan | null {
    const key = `${origin}-${destination}`
    const template = routeTemplates[key]

    if (!template) {
      // 动态生成路线
      return this.generateDynamicPlan(origin, destination, departureDate)
    }

    const recommendedRoute = template.routes[0]
    const chargeStops = this.calculateChargeStops(template.chargeStops, recommendedRoute.distance)

    const plan: RoutePlan = {
      id: `RP_${Date.now()}`,
      routes: template.routes,
      recommendedIndex: 0,
      totalDistance: recommendedRoute.distance,
      totalDuration: recommendedRoute.duration,
      totalToll: recommendedRoute.toll,
      fuelStops: template.fuelStops,
      chargeStops,
      restStops: template.restStops,
      departureTime: departureDate + 'T07:00:00',
      arrivalTime: this.calculateArrival(departureDate, recommendedRoute.duration),
      weatherAlerts: this.getWeatherAlerts(),
    }

    return plan
  }

  /** 动态生成路线（非预置路线） */
  private generateDynamicPlan(origin: string, destination: string, departureDate: string): RoutePlan {
    const estimatedDistance = Math.abs(destination.length - origin.length) * 150 + 200
    const estimatedDuration = Math.round(estimatedDistance / 80 * 60) + 60
    const chargeStops = this.estimateChargeStops(estimatedDistance)

    return {
      id: `RP_${Date.now()}`,
      routes: [{
        name: `推荐路线（${origin} → ${destination}）`,
        distance: estimatedDistance,
        duration: estimatedDuration,
        toll: Math.round(estimatedDistance * 0.45),
        trafficLevel: 'moderate',
        roadTypes: ['高速', '国道'],
        waypoints: [
          { name: origin, location: { lat: 39.9, lng: 116.4 }, type: 'destination' },
          { name: destination, location: { lat: 31.2, lng: 121.4 }, type: 'destination' },
        ],
      }],
      recommendedIndex: 0,
      totalDistance: estimatedDistance,
      totalDuration: estimatedDuration,
      totalToll: Math.round(estimatedDistance * 0.45),
      fuelStops: [],
      chargeStops,
      restStops: [
        { name: '中途服务区', type: 'service_area', distanceFromStart: Math.round(estimatedDistance / 2), amenities: ['餐饮', '充电', '卫生间'] },
      ],
      departureTime: departureDate + 'T07:00:00',
      arrivalTime: this.calculateArrival(departureDate, estimatedDuration),
      weatherAlerts: this.getWeatherAlerts(),
    }
  }

  /** 计算充电站点 */
  private calculateChargeStops(stations: EnergyStop[], totalDistance: number): EnergyStop[] {
    const effectiveRange = this.maxRange * this.currentBattery / 100
    if (effectiveRange >= totalDistance * 1.2) return [] // 不需要中途充电

    // 按距离筛选合适的充电站
    const neededStops = Math.ceil(totalDistance / effectiveRange) - 1
    return stations.slice(0, neededStops)
  }

  /** 估算充电站点（动态场景） */
  private estimateChargeStops(distance: number): EnergyStop[] {
    const effectiveRange = this.maxRange * this.currentBattery / 100
    if (effectiveRange >= distance * 1.2) return []
    const count = Math.ceil(distance / effectiveRange) - 1
    return Array.from({ length: count }, (_, i) => ({
      name: `充电站 ${i + 1}`,
      type: 'charge' as const,
      address: '沿途高速服务区',
      location: { lat: 39.9 - i * 2, lng: 116.4 + i * 2 },
      distanceFromStart: Math.round(distance / (count + 1) * (i + 1)),
      price: 1.5,
      brand: '国家电网',
      chargingPower: 120,
      availableChargers: 8,
    }))
  }

  /** 计算到达时间 */
  private calculateArrival(date: string, durationMinutes: number): string {
    const base = new Date(date + 'T07:00:00')
    const arrival = new Date(base.getTime() + durationMinutes * 60 * 1000)
    // 加上充电时间
    const chargeTime = Math.max(0, Math.ceil(durationMinutes / 300) * 30)
    const finalArrival = new Date(arrival.getTime() + chargeTime * 60 * 1000)
    return finalArrival.toISOString()
  }

  /** 获取天气预警 */
  private getWeatherAlerts(): WeatherAlert[] {
    // 模拟数据
    return [
      {
        type: '大雨',
        severity: 'info',
        description: '山东段预计有小到中雨，请注意行车安全',
        startTime: '2026-08-10T14:00:00',
        endTime: '2026-08-10T20:00:00',
      },
    ]
  }

  /** 出发前自检清单 */
  getPreTripChecklist(distance: number): string[] {
    return [
      '✅ 轮胎胎压检查（建议2.3 bar）',
      '✅ 刹车系统检查',
      '✅ 灯光系统检查',
      '✅ 雨刮器和玻璃水',
      '✅ 充电计划确认（沿途充电站已标注）',
      '✅ 应急工具包（三角牌、反光背心、急救包）',
      '✅ 驾驶证和行驶证',
      '✅ 空调系统检查',
      distance > 500 ? '✅ 建议携带便携充电枪' : '',
      this.currentBattery < 80 ? '⚠️ 出发前请充满电（当前' + this.currentBattery + '%）' : '',
    ].filter(Boolean)
  }

  /** 生成Agent消息 */
  generateMessage(type: string, data: any): AgentMessage {
    const base = {
      id: `travel_${Date.now()}`,
      timestamp: new Date().toISOString(),
      from: 'travel' as const,
      requiresAction: false,
    }

    switch (type) {
      case 'plan_ready':
        return {
          ...base,
          type: 'suggestion',
          content: `🚗 已为您规划「${data.destination}」出行方案：全程 ${data.totalDistance}km，预计 ${Math.round(data.totalDuration / 60)}h${data.totalDuration % 60}min，${data.chargeStops.length > 0 ? `沿途${data.chargeStops.length}个充电站` : '无需中途充电'}`,
          data,
          requiresAction: true,
          actionOptions: [
            { id: 'start_nav', label: '开始导航', type: 'primary', handler: 'START_NAV' },
            { id: 'view_details', label: '查看路线详情', type: 'secondary', handler: 'VIEW_ROUTE_DETAIL' },
          ],
        }
      case 'checklist':
        return {
          ...base,
          type: 'suggestion',
          content: '📝 出发前自检清单已生成',
          data,
        }
      default:
        return { ...base, type: 'status', content: data.toString(), data }
    }
  }
}

export const travelPlannerAgent = new TravelPlannerAgent()
