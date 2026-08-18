import express from 'express'
import cors from 'cors'
import { seedDatabase } from './db/init.js'
import indexRouter from './routes/index.js'
import vehicleRouter from './routes/vehicle.js'
import maintenanceRouter from './routes/maintenance.js'
import travelRouter from './routes/travel.js'
import serviceRouter from './routes/service.js'
import voiceRouter from './routes/voice.js'

const app = express()
const PORT = 3001

// 中间件
app.use(cors())
app.use(express.json())

// 初始化数据库种子数据
seedDatabase()

// 路由
app.use('/api', indexRouter)
app.use('/api/vehicles', vehicleRouter)
app.use('/api', maintenanceRouter) // stations, orders, parts
app.use('/api', travelRouter)      // plan, checklist
app.use('/api', serviceRouter)     // appointments, payment, report
app.use('/api/voice', voiceRouter)

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚗 车联智护 Agent 后端服务已启动`)
  console.log(`📡 API 地址: http://localhost:${PORT}/api`)
  console.log(`🏥 健康检查: http://localhost:${PORT}/api/health\n`)
})
