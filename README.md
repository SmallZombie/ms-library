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

A self-hosted web application for collecting, organizing, and previewing Minecraft skins and capes with interactive 3D rendering.

English | [简体中文](README-zh.md)

## Features

- **3D Preview** — Interactive Three.js-powered skin and cape viewer with walk animation
- **Skin & Cape Management** — Upload, categorize, tag, and track the source of your collection
- **Smart Import** — Import skins directly from NameMC and MinecraftSkins URLs
- **Search & Filter** — Search by name, filter by category and tags, sort by date
- **Cape & Elytra View** — Toggle between cape and elytra display modes
- **Skin–Cape Linking** — Associate capes with specific skins
- **Dark Mode** — Automatic system theme detection with manual toggle
- **Docker Ready** — Single-image deployment with volume-based data persistence

## Quick Start (Docker)

```bash
docker compose up -d
```

The app will be available at `http://localhost:3000`.

All data (database and uploaded files) is stored in the `./data` directory, which is mounted as a Docker volume.

## Quick Start (Development)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | shadcn/ui + Tailwind CSS v4 |
| 3D Rendering | Three.js (custom skin viewer) |
| Database | SQLite (via @libsql/client) |
| ORM | Drizzle ORM |
| Containerization | Docker (multi-stage build) |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── skins/              # Skin list, detail, and add pages
│   ├── capes/              # Cape list, detail, and add pages
│   └── api/                # REST API endpoints
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── skin-viewer.tsx     # 3D skin preview component
│   ├── skin-card.tsx       # Skin grid card
│   └── ...
├── lib/
│   ├── db/                 # Database schema and connection
│   ├── skin-viewer/        # Three.js skin rendering engine
│   └── site-parsers/       # NameMC & MSkins import parsers
└── hooks/                  # React hooks
data/                       # Runtime data (gitignored)
├── db.sqlite               # SQLite database
├── skins/                  # Uploaded skin PNG files
└── capes/                  # Uploaded cape PNG files
```

## Data Storage

- **Database**: SQLite file at `data/db.sqlite` — stores metadata (names, tags, categories, sources, file references)
- **Files**: Skin and cape images are stored as PNG files in `data/skins/` and `data/capes/` respectively
- **Deduplication**: Files are deduplicated by MD5 hash on upload

## API Endpoints

### Skins

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/skins` | List skins (with search, filter, pagination) |
| `POST` | `/api/skins` | Add a new skin |
| `GET` | `/api/skins/:id` | Get skin details |
| `PUT` | `/api/skins/:id` | Update skin metadata |
| `DELETE` | `/api/skins/:id` | Delete a skin |
| `GET` | `/api/skins/filters` | Get available types and tags |
| `GET` | `/api/skins/parse?url=` | Parse skin from external site |

### Capes

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/capes` | List capes |
| `POST` | `/api/capes` | Add a new cape |
| `GET` | `/api/capes/:id` | Get cape details |
| `PUT` | `/api/capes/:id` | Update cape metadata |
| `DELETE` | `/api/capes/:id` | Delete a cape |
| `GET` | `/api/capes/filters` | Get available types and tags |
