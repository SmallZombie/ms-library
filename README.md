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

A self-hostable web application for collecting, organizing, and previewing Minecraft skins and capes, with third-party login enabled via [Yggdrasil](https://minecraft.wiki/w/Yggdrasil).

English | [简体中文](README-zh.md)

## Features

- **3D Preview** — Interactive skin and cape viewer powered by Three.js, with walking animation support
- **Skin and Cape Management** — Upload, categorize, tag, and track sources
- **Search and Filtering** — Filter by name, category, and tags, and sort by time
- **Docker Deployment** — Single-image deployment with volume-based data persistence

## Quick Start

### Docker Compose
1. `docker-compose.yml`
```
services:
  ms-library:
    image: ghcr.io/smallzombie/ms-library:latest
    ports:
      - "3000:3000"
    volumes:
      - <your_data_dir>:/app/data
    restart: unless-stopped
```
2. `docker compose up -d`
3. Visit `http://localhost:3000`. The first registered account is automatically granted admin privileges.

### Development

1. `npm install`
2. `npm run dev` or `npm run dev:http`
3. Visit `http://localhost:3000`. The first registered account is automatically granted admin privileges.

## Next

### Third-Party Login

To enable third-party login (similar to LittleSkin), you only need to:

1. Configure the site URL in Site Settings.
<img src="./doc/image1.png" />

2. Create a profile.

3. Drag the link from the profile page, or manually enter the URL in a supported launcher.
<img src="./doc/image2.png" />

4. Sign in with your account name (or profile name) and password.

5. Enjoy.
