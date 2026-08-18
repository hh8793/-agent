/**
 * 车况监测 Agent —— 解析OBD故障码、胎压/机油/刹车片寿命预测
 */
import { OBDData, FaultCode, AgentMessage } from '../types'
import { faultCodeDB } from '../data/mockData'

export interface HealthReport {
  overallStatus: 'healthy' | 'attention' | 'critical'
  score: number // 0-100
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

export class VehicleHealthAgent {
  private obdData: OBDData | null = null
  private history: HealthReport[] = []

  /** 接入OBD实时数据 */
  ingestOBDData(data: OBDData): void {
    this.obdData = data
  }

  /** 全面车况检测 */
  runFullDiagnosis(): HealthReport {
    if (!this.obdData) {
      return { overallStatus: 'healthy', score: 100, issues: [], recommendations: ['暂无OBD数据接入'], checkedAt: new Date().toISOString() }
    }

    const issues: HealthIssue[] = []
    const recommendations: string[] = []

    // 1. 故障码解析
    const faultIssues = this.analyzeFaultCodes(this.obdData.dtcCodes)
    issues.push(...faultIssues)

    // 2. 胎压检测
    const tpIssues = this.checkTirePressure(this.obdData.tirePressure)
    issues.push(...tpIssues)

    // 3. 刹车片寿命预测
    const brakeIssues = this.checkBrakePads(this.obdData.brakePadLife)
    issues.push(...brakeIssues)

    // 4. 机油寿命检测
    if (this.obdData.oilLife < 15) {
      issues.push({
        component: '机油系统',
        severity: this.obdData.oilLife < 5 ? 'critical' : 'warning',
        detail: `机油寿命剩余 ${this.obdData.oilLife}%`,
        remainingLife: this.obdData.oilLife,
        suggestedAction: '尽快安排更换机油和机滤',
      })
    }

    // 5. 电量/油量检测
    if (this.obdData.fuelLevel < 15) {
      issues.push({
        component: '能源系统',
        severity: this.obdData.fuelLevel < 5 ? 'critical' : 'warning',
        detail: `当前电量/油量 ${this.obdData.fuelLevel}%`,
        remainingLife: this.obdData.fuelLevel,
        suggestedAction: '建议尽快补能',
      })
    }

    // 生成建议
    for (const issue of issues) {
      recommendations.push(`[${issue.severity === 'critical' ? '紧急' : issue.severity === 'warning' ? '注意' : '提示'}] ${issue.component}: ${issue.suggestedAction}`)
    }

    if (issues.length === 0) {
      recommendations.push('车辆各项指标正常，请继续保持定期检查')
    }

    // 计算综合得分
    const score = this.calculateHealthScore(issues)
    const overallStatus = score >= 85 ? 'healthy' : score >= 60 ? 'attention' : 'critical'

    const report: HealthReport = {
      overallStatus,
      score,
      issues,
      recommendations,
      checkedAt: new Date().toISOString(),
    }

    this.history.push(report)
    return report
  }

  /** 解析故障码 */
  private analyzeFaultCodes(codes: string[]): HealthIssue[] {
    return codes.map(code => {
      const fault = faultCodeDB[code]
      if (fault) {
        return {
          component: fault.category === 'engine' ? '发动机系统'
            : fault.category === 'transmission' ? '变速箱系统'
            : fault.category === 'brake' ? '制动系统'
            : fault.category === 'airbag' ? '安全气囊系统'
            : fault.category === 'abs' ? 'ABS防抱死系统'
            : fault.category === 'battery' ? '高压电池系统'
            : fault.category === 'emission' ? '排放系统'
            : '车身系统',
          severity: fault.severity === 'critical' ? 'critical' : 'warning',
          detail: `${fault.code}: ${fault.description}`,
          faultCode: fault.code,
          suggestedAction: fault.suggestedActions[0] || '请前往授权服务中心检测',
        }
      }
      return {
        component: '未知系统',
        severity: 'warning' as const,
        detail: `未知故障码: ${code}`,
        faultCode: code,
        suggestedAction: '请前往4S店进行专业诊断',
      }
    })
  }

  /** 胎压检测 */
  private checkTirePressure(tp: OBDData['tirePressure']): HealthIssue[] {
    const issues: HealthIssue[] = []
    const standard = 2.3
    const threshold = 0.3

    const checkSingle = (name: string, value: number) => {
      if (Math.abs(value - standard) > threshold) {
        issues.push({
          component: `轮胎系统 (${name})`,
          severity: value < 1.8 ? 'critical' : 'warning',
          detail: name === 'frontLeft' ? '左前轮' :
                  name === 'frontRight' ? '右前轮' :
                  name === 'rearLeft' ? '左后轮' : '右后轮'
                  + `胎压 ${value} bar (标准 ${standard} bar)`,
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

  /** 刹车片寿命预测 */
  private checkBrakePads(bp: OBDData['brakePadLife']): HealthIssue[] {
    const issues: HealthIssue[] = []
    if (bp.front < 20) {
      issues.push({
        component: '制动系统',
        severity: bp.front < 5 ? 'critical' : 'warning',
        detail: `前刹车片剩余寿命 ${bp.front}%，预估还可行驶 ${Math.round(bp.front * 200)} 公里`,
        remainingLife: bp.front,
        suggestedAction: bp.front < 5 ? '立即更换前刹车片！' : '请计划近期更换前刹车片',
      })
    }
    if (bp.rear < 20) {
      issues.push({
        component: '制动系统',
        severity: bp.rear < 5 ? 'critical' : 'warning',
        detail: `后刹车片剩余寿命 ${bp.rear}%，预估还可行驶 ${Math.round(bp.rear * 200)} 公里`,
        remainingLife: bp.rear,
        suggestedAction: bp.rear < 5 ? '立即更换后刹车片！' : '请计划近期更换后刹车片',
      })
    }
    return issues
  }

  /** 计算车况综合得分 */
  private calculateHealthScore(issues: HealthIssue[]): number {
    let score = 100
    for (const issue of issues) {
      if (issue.severity === 'critical') score -= 25
      else if (issue.severity === 'warning') score -= 10
      else score -= 3
    }
    return Math.max(0, score)
  }

  /** 获取故障码详细信息 */
  getFaultDetail(code: string): FaultCode | null {
    return faultCodeDB[code] || null
  }

  /** 生成Agent消息 */
  generateAlert(healthReport: HealthReport): AgentMessage[] {
    const messages: AgentMessage[] = []
    const criticalIssues = healthReport.issues.filter(i => i.severity === 'critical')
    const warningIssues = healthReport.issues.filter(i => i.severity === 'warning')

    if (criticalIssues.length > 0) {
      messages.push({
        id: `health_${Date.now()}_critical`,
        timestamp: new Date().toISOString(),
        from: 'health',
        type: 'alert',
        content: `🔴 紧急：检测到 ${criticalIssues.length} 项严重问题！${criticalIssues.map(i => i.component).join('、')}`,
        data: criticalIssues,
        requiresAction: true,
        actionOptions: [
          { id: 'book_emergency', label: '立即预约最近门店', type: 'primary', handler: 'EMERGENCY_BOOKING' },
          { id: 'call_roadside', label: '呼叫道路救援', type: 'danger', handler: 'CALL_ROADSIDE' },
          { id: 'view_detail', label: '查看详情', type: 'secondary', handler: 'VIEW_DETAIL' },
        ],
      })
    }

    if (warningIssues.length > 0 && criticalIssues.length === 0) {
      messages.push({
        id: `health_${Date.now()}_warning`,
        timestamp: new Date().toISOString(),
        from: 'health',
        type: 'alert',
        content: `⚠️ 注意：检测到 ${warningIssues.length} 项需关注的车辆问题`,
        data: warningIssues,
        requiresAction: false,
        actionOptions: [{ id: 'schedule_check', label: '安排检查', type: 'primary', handler: 'SCHEDULE_CHECK' }],
      })
    }

    return messages
  }

  /** 获取历史检测记录 */
  getHistory(): HealthReport[] {
    return this.history
  }
}

export const healthAgent = new VehicleHealthAgent()
