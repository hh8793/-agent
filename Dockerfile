# 构建阶段
FROM node:20-slim AS builder

WORKDIR /app

# 复制根 package.json 和前端配置
COPY package.json package-lock.json* ./
COPY vite.config.ts tsconfig.json tailwind.config.js postcss.config.js index.html ./

# 安装前端依赖
RUN npm ci || npm install

# 复制前端源码
COPY src/ ./src/
COPY public/ ./public/

# 构建前端
RUN npm run build

# 安装后端依赖
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci || npm install

# 复制后端源码并构建
COPY server/ ./server/
RUN cd server && npm run build

# 运行阶段
FROM node:20-slim AS runner

WORKDIR /app

# 复制后端 package.json 和已构建的 dist
COPY server/package.json ./server/
COPY --from=builder /app/server/dist ./server/dist

# 复制前端构建产物
COPY --from=builder /app/dist ./dist

# 安装生产依赖
RUN cd server && npm ci --omit=dev || npm install --omit=dev

EXPOSE $PORT

# 确保数据目录存在
RUN mkdir -p /app/server/src/data

CMD ["node", "server/dist/index.js"]
