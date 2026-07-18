# EcoChat 🌿

EcoChat is a secure, real-time, one-to-one messaging platform built with the MERN Stack. 

It implements a strict privacy boundary: **users cannot message strangers directly.** A conversation is only enabled after a chat request is explicitly accepted by the receiver.

---

## Technical Stack

### Frontend
- **React.js** (Vite template)
- **State Management**: Zustand
- **Real-Time Client**: Socket.io Client
- **Styling**: Tailwind CSS & Framer Motion (premium animations)
- **Forms**: React Hook Form
- **Toasts**: React Hot Toast

### Backend
- **Node.js** & **Express.js**
- **Database**: MongoDB & Mongoose
- **Real-Time Server**: Socket.io
- **Authentication**: JWT, silent refresh rotation, HttpOnly cookies, Google OAuth 2.0 (Passport)
- **Security**: Helmet, CORS, Rate Limiting (express-rate-limit), Bcrypt
- **Media Uploads**: Multer & Cloudinary (with an automatic local storage fallback!)

---

## Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org) (v18.0.0+)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### 2. Clone/Extract the Project Workspace
Ensure the code is placed inside:
`C:\Users\kushe\.gemini\antigravity\scratch\ecochat`

---

## Configuration (`.env`)

In the `server/` directory, copy the configuration template:
```bash
cd server
cp .env.example .env
```

Open `server/.env` and configure:
1. **MONGODB_URI**: Your MongoDB connection string (e.g. `mongodb://localhost:27017/ecochat`).
2. **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: Go to [Google Cloud Console](https://console.cloud.google.com/), create a project, navigate to **APIs & Services -> Credentials**, create an **OAuth Client ID**, select **Web Application**, set the Authorized Redirect URI to `http://localhost:5000/api/auth/google/callback`, and copy the credentials.
3. **CLOUDINARY** (Optional): If left blank, the application will automatically fall back to saving profile avatars locally inside the `server/public/uploads` folder and serving them statically.

---

## Installation & Run

### Step 1: Start Backend Server
```bash
cd server
npm install
npm run dev
```
The server will run on `http://localhost:5000`.

### Step 2: Start Frontend Client
```bash
cd client
npm install
npm run dev
```
The client will start on `http://localhost:5173`. 
*(Vite is pre-configured with a proxy to automatically route `/api` and `/socket.io` requests to the port `5000` backend server, avoiding CORS and cookie issues on localhost).*

---

## Core Security Architectures

1. **HttpOnly Cookie JWT Sessions**: Access tokens are sent via strict `HttpOnly` Lax cookies. A rotation check refresh token mechanism prevents token hijack vectors.
2. **Username Claim Onboarding**: Google profiles do not have usernames. EcoChat forces a new user through a claim onboarding page (using debounce validation check) before allowing dashboard access.
3. **Rate Limiting**: Auth pathways are limited to 30 requests/15m, and standard APIs to 200 requests/15m to block brute-forcing and denial attacks.
