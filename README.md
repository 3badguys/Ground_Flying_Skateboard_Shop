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
│   │       │   ├── auth/            # 认证与用户管理
│   │       │   ├── settings/       # 系统设置
│   │       │   └── backup/         # 系统备份与恢复
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
│           │   ├── settings/    # 系统设置页 / 系统备份页
│           │   └── auth/        # 登录、账号信息、用户管理
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
- **系统备份** — 一键备份数据库并下载 .sql 文件，支持上传恢复、30 天自动清理
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
# 数据库（唯一数据源，docker-compose 从这里取值）
DB_USER=postgres
DB_PASSWORD=<your-password>
DB_NAME=skateboard_shop

# 前端
VITE_BASE=/gfs/
APP_BASE_URL=https://your-domain.com
CAPACITOR_REMOTE=false

# npm 镜像（加速国内 Docker 构建）
NPM_REGISTRY=https://registry.npmmirror.com/
```

> 改完运行 `npm run sync:config` 同步到各子配置。

#### npm 镜像源

`NPM_REGISTRY` 用于加速 Docker 构建时的 `npm install`，可设为国内镜像（阿里云 `npmmirror.com`、腾讯云 `mirrors.cloud.tencent.com/npm/` 等）。

推荐用 **nrm**（Node Registry Manager）快速选择最快的镜像源：

```bash
# 全局安装 nrm
npm install -g nrm

# 查看所有可用镜像源
nrm ls

# 测试各镜像源的延迟，选最快的
nrm test

# 切换到指定源
nrm use taobao
```

选好最快的源后，把对应地址填入 `.env` 的 `NPM_REGISTRY` 即可。留空则使用 npm 官方源 `https://registry.npmjs.org`。

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
npm run app:build:android   # Windows / Linux / Mac
npm run app:build:ios       # macOS only
```

**Android**

Android Studio → Open `packages/frontend/android` → Build APK

APK: `packages/frontend/android/app/build/outputs/apk/debug/app-debug.apk`

**iOS**

Xcode → Open `packages/frontend/ios/App.xcworkspace` → Build

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
- **users** — 用户认证（SUPER_ADMIN / ADMIN / USER）
- **refresh_tokens** — JWT 刷新令牌

## 系统备份与恢复

后台 **系统备份** 页签（SUPER_ADMIN / ADMIN）提供数据库备份与恢复：

| 功能 | 说明 |
|------|------|
| **备份数据库** | 后端调用 `pg_dump` 生成 `gfs_database_YYYYMMDD_HHMMSS.sql`，浏览器自动下载，Toast 提示成功 |
| **备份记录** | 列出服务器上的备份文件（名称 / 大小 / 时间），支持再次下载与删除 |
| **恢复数据库** | 上传 .sql 文件，二次确认后执行恢复；`psql` 以 `--single-transaction` 运行，失败自动回滚 |

实现要点：

- 备份文件存储在服务器本地（`BACKUP_DIR`，默认 `工作目录/backups`，Docker 中为 `/app/backups` 命名卷 `backups_data`），自动清理 **30 天前** 的旧文件。
- 后端镜像需安装 PostgreSQL 客户端（`Dockerfile` 已添加 `postgresql16-client`，提供 `pg_dump` / `psql`）。
- 下载接口直接流式返回文件，绕过全局 JSON 响应拦截器；前端用 Blob + 鉴权头触发浏览器下载。
- 备份 / 恢复仅对 `SUPER_ADMIN`、`ADMIN` 开放。

## 认证系统

采用 JWT 双令牌认证 + 角色权限控制。

### 角色

| 角色 | 登录方式 | 创建者 | 权限 |
|------|---------|--------|------|
| 超级管理员 (SUPER_ADMIN) | 用户名 | 初始化脚本 | 全部权限，可创建管理员 |
| 管理员 (ADMIN) | 用户名 | 超级管理员 | 管理学生数据，可创建普通用户 |
| 普通用户 (USER) | 手机号 | 超级管理员 / 管理员 | 查看关联学生信息 |

### 环境变量

在 `.env` 中添加：

```
# JWT 认证
# Generate with: openssl rand -base64 32
ACCESS_SECRET=change-me-to-a-random-string-at-least-32-chars
REFRESH_SECRET=change-me-to-another-random-string-at-least-32-chars
ACCESS_EXPIRES=15m
REFRESH_EXPIRES=7d

# 超级管理员初始账号
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=Admin@123
SUPER_ADMIN_FORCE_RESET=false
```

### 初始化

1. 运行 `npm run db:seed` 创建初始超级管理员。
2. 打开 `/login`，用配置的超级管理员账号登录。
3. 在 **用户管理** 页面创建管理员和普通用户。

### 令牌流程

- 访问令牌（默认 15 分钟）通过 `Authorization: Bearer <token>` 请求头传递
- 刷新令牌（默认 7 天）存储在 localStorage，用于获取新的访问令牌
- 登出和修改密码时令牌自动失效
- 前端 401 响应自动触发令牌刷新

## Nginx 网关代理（Dev vs Prod）

| 模式 | Vite base | Nginx 剥离前缀 | 原因 |
|------|-----------|---------------|------|
| **Dev** | `/frpc/gfs/` | **不剥离** | Vite 内部路径（HMR、源码、模块）都带 base 前缀，Nginx 原样转发，Vite 自己匹配 |
| **Prod** | `/frpc/gfs/` | **剥离** | 编译后只有一个 JS/CSS 入口，路径扁平化，Nginx 剥离避免重复前缀 |

```nginx
# Dev — 不剥离
location /frpc/gfs/ {
    proxy_pass http://skateboard-frontend:5173;   # 末尾无 /
}

# Prod — 剥离
location /frpc/gfs/ {
    proxy_pass http://skateboard-frontend:80/;    # 末尾有 /
}
```

## Vite 子路径代理

当 `VITE_BASE` 设为 `/frpc/gfs/` 时，Vite proxy 需动态匹配：

```ts
proxy: base !== '/'
  ? {
      [`${base}api/`]: {
        target: 'http://skateboard-backend:3000',
        rewrite: (path) => path.replace(/^\/frpc\/gfs\/api/, '/api'),
      },
    }
  : {
      '/api/': { target: 'http://skateboard-backend:3000' },
    },
```

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
