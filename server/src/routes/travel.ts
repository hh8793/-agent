import { Router } from 'express'
import { travelPlannerAgent } from '../agents/TravelPlannerAgent.js'

const router = Router()

// 规划出行路线
router.post('/plan', (req, res) => {
  const { origin, destination, departureDate, batteryLevel, maxRange } = req.body
  if (batteryLevel !== undefined) travelPlannerAgent.setVehicleStatus(batteryLevel, maxRange || 525)
  const plan = travelPlannerAgent.planTrip(origin, destination, departureDate)
  if (!plan) return res.status(404).json({ error: '无法规划路线' })
  res.json(plan)
})

// 获取出发前自检清单
router.get('/checklist', (req, res) => {
  const distance = parseInt(req.query.distance as string) || 0
  const checklist = travelPlannerAgent.getPreTripChecklist(distance)
  res.json(checklist)
})

export default router
