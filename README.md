# 🎬 DevForge 24-Hour Countdown & Cinema Clapperboard Stage

A real-time 24-hour hackathon countdown timer and Kollywood-themed clapperboard presentation stage built with React, Vite, and Node.js Socket.IO.

## 🚀 Key Features

- **Real-Time Cross-Device Synchronization**: Admin controls on one computer (or phone) update the audience stage screen, projector, and judging screens instantly over WebSockets.
- **Cinema Clapperboard Slate**: Cinematic design with realistic clapperboard, animated roll status, and projector lighting effects.
- **Kollywood Mass Actions & Meme Alerts**: Kaapi Break, Kaithi Briyani Time, Naan Ready, Hai Chelloo, and Power Nap triggers with cinema audio whistles and fanfare.
- **Live Sound Effects**: Cinema clapperboard sound on start/reset, click sounds, fanfare for announcements, and whistling cheer audio.
- **Resilient Offline & Local Fallback**: Automatically falls back to `BroadcastChannel` and `localStorage` if running offline or without a backend.
- **In-App Backend Switcher**: Configure or change the real-time server URL directly from the `/admin` settings without redeploying.

## 📦 Project Structure

- `/src`: Vite + React frontend (Stage Screen `/` and Admin Panel `/admin`).
- `/server`: Lightweight Node.js + Express + Socket.IO real-time backend with state persistence.
- `BACKEND_DEPLOYMENT_GUIDE.md`: Step-by-step instructions to deploy the backend to Render, Railway, or Heroku.

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
cd server && npm install && cd ..
```

### 2. Start the Real-Time Backend
```bash
npm run server
```
The server will run on `http://localhost:3001` with health checks at `/health`.

### 3. Start the Frontend
```bash
npm run dev
```

- **Audience / Stage Display**: [http://localhost:5173/](http://localhost:5173/)
- **Admin Control Panel**: [http://localhost:5173/admin](http://localhost:5173/admin)

## 🌐 Deploying with Vercel

See [BACKEND_DEPLOYMENT_GUIDE.md](./BACKEND_DEPLOYMENT_GUIDE.md) for full instructions on deploying the Node.js backend to Render (free) and connecting your Vercel frontend.

# dev_count
