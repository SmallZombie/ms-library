```
  __  __  _____ _      _ _
 |  \/  |/ ____| |    (_) |
 | \  / | (___ | |     _| |__  _ __ __ _ _ __ _   _
 | |\/| |\___ \| |    | | '_ \| '__/ _` | '__| | | |
 | |  | |____) | |____| | |_) | | | (_| | |  | |_| |
 |_|  |_|_____/|______|_|_.__/|_|  \__,_|_|   \__, |
                                               __/ |
                                              |___/
```

# Minecraft Skin Library

一个可私有部署的 Web 应用，用于收集、整理和预览 Minecraft 皮肤与披风，带有交互式 3D 渲染。

[English](README.md) | 简体中文

### 功能特性

- **3D 预览** — 基于 Three.js 的交互式皮肤和披风查看器，支持行走动画
- **皮肤与披风管理** — 上传、分类、打标签，并记录来源
- **智能导入** — 支持从 NameMC 和 MinecraftSkins 的 URL 直接导入皮肤
- **搜索与筛选** — 按名称搜索，按分类和标签筛选，按时间排序
- **披风与鞘翅切换** — 在披风和鞘翅显示模式之间切换
- **皮肤-披风关联** — 将披风与特定皮肤关联
- **深色模式** — 自动检测系统主题，支持手动切换
- **Docker 部署** — 单镜像部署，基于 volume 的数据持久化

### 快速开始 (Docker)

```bash
docker compose up -d
```

应用将在 `http://localhost:3000` 上可用。

所有数据（数据库和上传的文件）存储在 `./data` 目录中，作为 Docker volume 挂载。

### 快速开始 (开发)

```bash
npm install
npm run dev
```

在浏览器中打开 `http://localhost:3000`。

### 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| 3D 渲染 | Three.js（自研皮肤查看器） |
| 数据库 | SQLite（via @libsql/client） |
| ORM | Drizzle ORM |
| 容器化 | Docker（多阶段构建） |

### 数据存储

- **数据库**：SQLite 文件位于 `data/db.sqlite` — 存储元数据（名称、标签、分类、来源、文件引用）
- **文件**：皮肤和披风图片分别存储为 PNG 文件在 `data/skins/` 和 `data/capes/` 目录下
- **去重**：上传时通过 MD5 哈希进行文件去重
