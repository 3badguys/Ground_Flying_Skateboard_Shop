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
| 移动端 | Capacitor（Android & IOS）+ PWA |

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
- **Android & IOS App** — Capacitor 打包 APP，原生安装

## 快速开始

### 环境要求

- Docker Engine
- Docker Compose v2.0+
- Node.js
- Android Studio（仅打包 APK 时需要）
- macOS + Xcode（仅打包 IPA 时需要）

### 0. 创建共享网络

项目使用外部共享网络 `shared_gateway_net`，首次部署前需创建：

```bash
docker network create shared_gateway_net 2>/dev/null || true
```

只需执行一次，后续所有服务共用。

### 1. 配置文件 .env

首次部署从 `.env.example` 复制并修改：

```bash
cp .env.example .env
```

核心配置：

```
APP_BASE_URL=https://your-domain.com    # 服务器地址
VITE_BASE=/gfs/                         # 前端路径前缀
CAPACITOR_REMOTE=false                  # App 远程模式开关
```

改完运行 `npm run sync:config` 同步到各子配置。

### 2. 启动服务

```bash
# 生产模式（推荐）
npm run start

# 开发模式（代码热重载）
npm run start:dev
```

如果需要外网访问（手机 PWA 测试等），额外启动 ngrok：

```bash
docker compose --profile optional up -d ngrok
docker logs skateboard-ngrok  # 获取公网 URL
```

### 3. 生成 APP

```bash
npm run app:build
```

自动完成：编译前端 → 同步 Android 工程。

---

完成后在 Android Studio 中：

```
File → Open → 选择 packages/frontend/android
Build → Build Bundle(s) / APK(s) → Build APK(s)
```

APK 路径：`packages/frontend/android/app/build/outputs/apk/debug/app-debug.apk`

**iOS**

生成 iOS 工程后，在 Mac 上用 Xcode 打开 `packages/frontend/ios/App.xcworkspace`，Build 即可。

> iOS 构建需要 macOS + Xcode

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

## Nginx proxy_pass 参考

| proxy_pass | 请求 `/gfs/api/students` | 转发给 upstream |
|---|---|---|
| `http://upstream;` | 保留原 URI | `/gfs/api/students` |
| `http://upstream/;` | 剥离匹配的 location 前缀 | `/students` |
| `http://$upstream;` | 变量禁用自动替换，保留原 URI | `/gfs/api/students` |
| `http://$upstream/;` | 变量禁用自动替换，保留原 URI | `/gfs/api/students` |

> **核心规则**：如果 proxy_pass 的值包含变量（`$var`），nginx 会跳过 URI 重写，末尾 `/` 不生效。需要手动用 `rewrite` 剥离前缀：
> ```nginx
> location /gfs/ {
>     set $upstream example:80;
>     rewrite ^/gfs/(.*) /$1 break;
>     proxy_pass http://$upstream;
> }
> ```
