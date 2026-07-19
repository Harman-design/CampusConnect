# CampusConnect – College Portal Super App (v1.0.0)

CampusConnect is a high-performance, secure, and responsive super-app ecosystem built for students, faculties, and administrators of SRM Ramapuram College. 

This repository houses a unified codebase featuring a React Web Client, a cross-platform Flutter Mobile (Android, iOS) client, and a Node.js/Express backend server backed by MongoDB.

---

## 🏗 System Architecture

```mermaid
graph TD
    Client[React Web Client / Flutter App] -->|HTTPS Requests| API[Express API Server]
    Client -->|WebSockets| Socket[Socket.IO Server]
    API -->|Data Queries| Mongo[(MongoDB Atlas)]
    API -->|File Operations| Firebase[(Firebase Cloud Storage)]
    API -->|AI Requests| Gemini[(Google Gemini AI)]
    API -->|Verify Signature| Razorpay[(Razorpay Gateway)]
```

---

## 🛠 Technology Stack

### Frontend Web
- **React v18** + **Vite** + **TailwindCSS**
- **React Router v6** (Role-based path protection)
- **Recharts** (Interactive statistics dashboards)

### Mobile & Tablet (Cross-Platform)
- **Flutter** (Material 3 Adaptive layouts)
- **Provider** (Global auth & state management)
- **Flutter Markdown** (Syllabus guides)

### Backend API
- **Node.js** + **Express**
- **Mongoose** (MongoDB Object modeling)
- **Socket.IO** (Real-time live notifications)
- **Google Gemini API** & **Firebase Admin SDK**

---

## 📂 Folder Structure

```
campusconnect/
├── backend/
│   ├── config/             # DB & Firebase initializers
│   ├── controllers/        # MERN business logic
│   ├── middleware/         # JWT parsing & rate limiting
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express API endpoints
│   ├── services/           # Gemini AI & Razorpay gateways
│   ├── utils/              # Cryptographic tools
│   ├── Dockerfile          # Production docker build configuration
│   └── server.js           # Server entrance point
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable layout shells
│   │   ├── pages/          # Auth, Academics, Admin portals
│   │   └── routes/         # Protected routers map
│   └── vercel.json         # Vercel deployment configuration
├── flutter_client/
│   ├── lib/
│   │   ├── screens/        # Adaptive Material 3 views
│   │   ├── services/       # Provider states & API loops
│   │   └── widgets/        # Breakpoint and lock alerts
│   └── pubspec.yaml        # Flutter project packages
├── docker-compose.yml      # Local dev stack runner
└── render.yaml             # Render cloud build specifications
```

---

## ⚙ Environment Variables

Create a `.env` file inside `backend/` using the template below:

```env
# SERVER CONFIG
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-app.vercel.app

# DATABASE
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/db

# JWT SECRETS
JWT_ACCESS_SECRET=your_access_signature_key
JWT_REFRESH_SECRET=your_refresh_signature_key

# GOOGLE GEMINI AI
GEMINI_API_KEY=AIzaSyYourGeminiApiKey
GEMINI_MODEL=gemini-3.5-flash

# RAZORPAY GATEWAY
RAZORPAY_KEY_ID=rzp_test_key_id
RAZORPAY_KEY_SECRET=key_secret
```

---

## 🚀 Installation & Local Launch

### 1. Run the Backend API Server
```bash
cd backend
npm install
npm run dev
```

*To seed a default Administrator account:*
```bash
npm run seed:admin -- --name "Admin User" --email admin@srmist.edu.in --password Admin@12345
```

### 2. Run the React Web Client
```bash
cd frontend
npm install
npm run dev
```

### 3. Run the Flutter Mobile/Tablet Client
```bash
cd flutter_client
flutter pub get
flutter run
```

---

## 📁 Deployment Guide

- **Backend (Render)**: Render automatically parses `render.yaml` to spin up a Dockerized API container. Ensure MongoDB IP access lists allow inbound queries.
- **Web Frontend (Vercel)**: Point your Vercel project at the `frontend/` directory. Sub-paths are automatically rewritten by `vercel.json`.

---

## 🔮 Future Scope
- **Grade Cards PDF Export**: Allow students to download official certified PDF transcripts.
- **Face Recognition Attendance**: Machine learning integration for biometric classroom check-ins.

---

## 📝 License
Distributed under the MIT License. See `LICENSE` for more information.
