import { getLatestOBD, getFaultCode, getAllFaultCodes, insertHealthReport, getHealthReports } from '../db/init.js'
import type { OBDData, FaultCode, HealthReport, HealthIssue } from '../types.js'

// ============ 车况监测 Agent ============
export class VehicleHealthAgent {
  getOBDData(vehicleId: string): OBDData | null {
    return getLatestOBD(vehicleId)
  }

  runFullDiagnosis(vehicleId: string): HealthReport {
    const obdData = this.getOBDData(vehicleId)
    if (!obdData) {
      return { overallStatus: 'healthy', score: 100, issues: [], recommendations: ['暂无OBD数据接入'], checkedAt: new Date().toISOString() }
    }

    const issues: HealthIssue[] = []
    const recommendations: string[] = []

    issues.push(...this.analyzeFaultCodes(obdData.dtcCodes))
    issues.push(...this.checkTirePressure(obdData.tirePressure))
    issues.push(...this.checkBrakePads(obdData.brakePadLife))

    if (obdData.oilLife < 15) {
      issues.push({
        component: '机油系统',
        severity: obdData.oilLife < 5 ? 'critical' : 'warning',
        detail: `机油寿命剩余 ${obdData.oilLife}%`,
        remainingLife: obdData.oilLife,
        suggestedAction: '尽快安排更换机油和机滤',
      })
    }
    if (obdData.fuelLevel < 15) {
      issues.push({
        component: '能源系统',
        severity: obdData.fuelLevel < 5 ? 'critical' : 'warning',
        detail: `当前电量/油量 ${obdData.fuelLevel}%`,
        remainingLife: obdData.fuelLevel,
        suggestedAction: '建议尽快补能',
      })
    }

    for (const issue of issues) {
      recommendations.push(`[${issue.severity === 'critical' ? '紧急' : issue.severity === 'warning' ? '注意' : '提示'}] ${issue.component}: ${issue.suggestedAction}`)
    }
    if (issues.length === 0) recommendations.push('车辆各项指标正常，请继续保持定期检查')

    const score = this.calculateHealthScore(issues)
    const overallStatus = score >= 85 ? 'healthy' : score >= 60 ? 'attention' : 'critical'

    const report: HealthReport = { overallStatus, score, issues, recommendations, checkedAt: new Date().toISOString() }

    insertHealthReport({ vehicle_id: vehicleId, ...report })

    return report
  }

  private analyzeFaultCodes(codes: string[]): HealthIssue[] {
    return codes.map(code => {
      const fault = getFaultCode(code)
      if (fault) {
        return {
          component: fault.category === 'engine' ? '发动机系统' : fault.category === 'transmission' ? '变速箱系统' : fault.category === 'brake' ? '制动系统' : fault.category === 'airbag' ? '安全气囊系统' : fault.category === 'abs' ? 'ABS防抱死系统' : fault.category === 'battery' ? '高压电池系统' : fault.category === 'emission' ? '排放系统' : '车身系统',
          severity: fault.severity === 'critical' ? 'critical' : 'warning',
          detail: `${fault.code}: ${fault.description}`,
          faultCode: fault.code,
          suggestedAction: fault.suggestedActions[0] || '请前往授权服务中心检测',
        }
      }
      return { component: '未知系统', severity: 'warning' as const, detail: `未知故障码: ${code}`, faultCode: code, suggestedAction: '请前往4S店进行专业诊断' }
    })
  }

  private checkTirePressure(tp: OBDData['tirePressure']): HealthIssue[] {
    const issues: HealthIssue[] = []
    const standard = 2.3
    const threshold = 0.3
    const checkSingle = (name: string, value: number) => {
      if (Math.abs(value - standard) > threshold) {
        issues.push({
          component: `轮胎系统 (${name})`,
          severity: value < 1.8 ? 'critical' : 'warning',
          detail: (name === 'frontLeft' ? '左前轮' : name === 'frontRight' ? '右前轮' : name === 'rearLeft' ? '左后轮' : '右后轮') + `胎压 ${value} bar (标准 ${standard} bar)`,
          remainingLife: value,
          suggestedAction: value < standard ? '请充气至标准胎压' : '请适当放气',
        })
      }
    }
    checkSingle('frontLeft', tp.frontLeft)
    checkSingle('frontRight', tp.frontRight)
    checkSingle('rearLeft', tp.rearLeft)
    checkSingle('rearRight', tp.rearRight)
    return issues
  }

  private checkBrakePads(bp: OBDData['brakePadLife']): HealthIssue[] {
    const issues: HealthIssue[] = []
    if (bp.front < 20) {
      issues.push({ component: '制动系统', severity: bp.front < 5 ? 'critical' : 'warning', detail: `前刹车片剩余寿命 ${bp.front}%，预估还可行驶 ${Math.round(bp.front * 200)} 公里`, remainingLife: bp.front, suggestedAction: bp.front < 5 ? '立即更换前刹车片！' : '请计划近期更换前刹车片' })
    }
    if (bp.rear < 20) {
      issues.push({ component: '制动系统', severity: bp.rear < 5 ? 'critical' : 'warning', detail: `后刹车片剩余寿命 ${bp.rear}%，预估还可行驶 ${Math.round(bp.rear * 200)} 公里`, remainingLife: bp.rear, suggestedAction: bp.rear < 5 ? '立即更换后刹车片！' : '请计划近期更换后刹车片' })
    }
    return issues
  }

  private calculateHealthScore(issues: HealthIssue[]): number {
    let score = 100
    for (const issue of issues) {
      if (issue.severity === 'critical') score -= 25
      else if (issue.severity === 'warning') score -= 10
      else score -= 3
    }
    return Math.max(0, score)
  }

  getFaultDetail(code: string): FaultCode | null {
    return getFaultCode(code)
  }

  getAllFaultCodes(): Record<string, FaultCode> {
    const map: Record<string, FaultCode> = {}
    for (const fc of getAllFaultCodes()) {
      map[fc.code] = fc
    }
    return map
  }

  getHistory(vehicleId: string): HealthReport[] {
    const rows = getHealthReports(vehicleId)
    return rows.slice(-10).reverse().map(r => {
      const { vehicle_id, ...report } = r
      return report as HealthReport
    })
  }
}

export const healthAgent = new VehicleHealthAgent()
