# 地面飞行滑板店系统

滑板培训机构的学员管理与课程预约系统，支持 PC 浏览器和 H5 移动端访问，可打包为 Android App。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Element Plus + ECharts |
| 后端 | NestJS + TypeScript + Prisma |
| 数据库 | PostgreSQL 16 |
| Web 服务器 | Nginx（生产模式） |
| 容器化 | Docker Compose |
| 移动端 | Capacitor（Android APK）+ PWA |

## 项目结构

```
Ground_Flying_Skateboard_Shop/
├── docker-compose.yml          # 生产环境
├── docker-compose.dev.yml      # 开发环境覆盖
├── .env                        # 统一配置（环境变量）
├── .env.example                # 配置模板
├── scripts/
│   └── sync-config.cjs         # 从 .env 生成配置
├── packages/
│   ├── backend/                # NestJS 后端
│   │   ├── Dockerfile          # 多阶段构建（development/builder/production）
│   │   ├── prisma/
│   │   │   └── schema.prisma   # 数据库模型
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── student/        # 学生管理
│   │       │   ├── course-info/    # 课程信息
│   │       │   ├── class-record/   # 上课记录
│   │       │   ├── booking/        # 预约上课
│   │       │   ├── statistics/     # 数据统计
│   │       │   └── settings/       # 系统设置
│   │       └── common/             # 公共模块
│   └── frontend/               # Vue 3 前端
│       ├── Dockerfile
│       ├── nginx.conf           # 生产 Nginx 配置
│       ├── capacitor.config.json # Capacitor 配置（自动生成）
│       └── src/
│           ├── views/
│           │   ├── student/     # 学生信息页
│           │   ├── booking/     # 预约上课页
│           │   ├── calendar/    # 课程表（日历视图）
│           │   ├── statistics/  # 数据统计图表
│           │   └── settings/    # 系统设置页
│           ├── components/      # 公共组件
│           ├── api/             # API 请求封装
│           └── router/          # 路由配置
```

## 功能模块

- **学生信息** — 增删改学生，课自动计算，课程信息/上课记录子表
- **预约上课** — 选学生自动带出信息，起止时间自动算课时，防超扣校验
- **课程表** — 日历热度图展示每日上课情况，点击查看详情
- **数据统计** — 月度收入、课时消耗、学生报课柱状/折线图
- **系统设置** — 课时预警数配置，剩余课时低于阈值标红
- **PWA** — 手机浏览器添加到桌面，独立窗口运行
- **Android App** — Capacitor 打包 APK，原生安装

## 快速开始

### 环境要求

- Docker Desktop
- Node.js（仅打包 APK 时需要）
- Android Studio（仅打包 APK 时需要）

### 0. 创建共享网络

项目使用外部共享网络 `shared_gateway_net`，首次部署前需创建：

```bash
docker network create shared_gateway_net 2>/dev/null || true
```

只需执行一次，后续所有服务共用。

### 1. 启动服务

```bash
# 生产模式（推荐）
npm run start

# 开发模式（代码热重载）
npm run start:dev
```

首次运行会自动查 IP、生成 `.env`、构建镜像并启动。
浏览器打开 `http://localhost:5173` 即可访问。

如果需要外网访问（手机 PWA 测试等），额外启动 ngrok：

```bash
docker compose --profile optional up -d ngrok
docker logs skateboard-ngrok  # 获取公网 URL
```

### 2. 配置文件 .env

首次运行 `npm run start` 会自动生成，后续也可手动编辑。需要外网访问时手动填入 ngrok token：

```
NGROK_AUTHTOKEN=你的ngrok令牌    # 可选，用于外网 HTTPS 访问
CAPACITOR_URL=http://你的IP:5173 # 可选，App 远程模式（壳加载此地址）
API_BASE_URL=http://你的IP:5173  # 可选，App 本地模式（Nginx 代理 `/api`）
```

### 3. 生成 Android APK

**方式一：一条命令**

```bash
npm run app:build
```

自动完成：读取 .env 生成配置 → 编译前端 → 同步 Android 工程。

**方式二：分步执行**

```bash
npm run sync:config                                    # 1. 从 .env 生成配置
cd packages/frontend && npm run build && npx cap sync android  # 2. 编译 + 同步
```

---

以上两步任选其一，完成后在 Android Studio 中：

```
File → Open → 选择 packages/frontend/android
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

APK 路径：`packages/frontend/android/app/build/outputs/apk/debug/app-debug.apk`

### 4. 常用命令

```bash
# 停止服务
npm run stop

# 查看日志
docker compose logs -f backend

# 重启单个服务
docker compose restart frontend

# 数据库迁移
docker exec skateboard-backend npx prisma migrate deploy

# 进入容器
docker exec -it skateboard-backend sh
```

## 端口说明

| 端口 | 服务 | 模式 |
|------|------|------|
| 5173 | 前端 | 开发/生产 |
| 3000 | 后端 API | 开发（直接暴露） |
| 5432 | PostgreSQL | 所有模式 |
| 4040 | ngrok 面板 | 可选 |

## 数据库

PostgreSQL，通过 Prisma ORM 管理，模型定义在 `packages/backend/prisma/schema.prisma`。

主要表结构：
- **students** — 学生基本信息
- **course_infos** — 课程报名记录
- **class_records** — 上课记录
- **settings** — 系统配置（键值对）
