# 🔐 KeyAuth – Keystroke Dynamics Authentication with Stealth Surveillance & Honeypot UI

> **Advanced Keystroke Dynamics Authentication with Stealth Surveillance and Honeypot UI for Continuous Protection of Digital Assets**
>
> B.E. Cyber Security Mini Project – Paavai Engineering College, Namakkal (Autonomous), Nov 2025

KeyAuth is a multi-layer authentication demo that goes beyond passwords. Even if an attacker steals a valid password, KeyAuth can still detect them by **how they type**, **who they look like**, and then **trap them in a fake dashboard** while logging everything they do.

---

## ✨ Features

| Layer | What it does |
|-------|--------------|
| ⌨️ **Keystroke Dynamics** | Records dwell time, flight time and total typing time while the password is typed, then compares it with the registered typing signature. |
| 📷 **Stealth Facial Surveillance** | If the typing pattern is abnormal, the webcam silently captures a photo (hidden `<video>`/`<canvas>`, no on-screen prompt). |
| 🧑 **Facial Match Verification** | The captured image is compared with the reference photos taken at registration (simulated face recognition for academic demo). |
| 🍯 **Honeypot Dashboard** | Failed verification redirects the user to a realistic fake dashboard with no real data. Intruder activity is monitored. |
| 📝 **Suspicious Activity Log** | Timestamp, username, reason and captured intruder photo are logged and shown on the real dashboard. |

---

## 🔄 Authentication Flow

```
Enter credentials
      │
      ▼
Password correct? ──No──► "Invalid credentials"
      │Yes
      ▼
Keystroke pattern matches? ──Yes──► ✅ Real Dashboard
      │No
      ▼
Silent webcam capture
      │
      ▼
Face matches? ──Yes──► ✅ Real Dashboard
      │No
      ▼
🍯 Honeypot Dashboard  +  📝 Log suspicious activity
```

---

## 🛠️ Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server & build)
- **Tailwind CSS** (via CDN)
- **WebRTC** (`getUserMedia`) for camera capture
- **localStorage** as a simulated database
- Simulated face recognition module (`faceApiSimulator.ts`)

---

## 📁 Project Structure

```
KeyAuth/
├── App.tsx                         # App shell & page routing
├── index.tsx                       # React entry point
├── index.html
├── types.ts                        # Shared TypeScript types
├── components/
│   ├── LoginPage.tsx               # Login + keystroke check + face check
│   ├── RegisterPage.tsx            # 4-step registration (typing calibration + photos)
│   ├── SilentCameraCapture.tsx     # Hidden camera capture at login
│   ├── ActiveCameraCapture.tsx     # Visible capture during registration
│   ├── RealDashboard.tsx           # Dashboard for genuine users
│   ├── HoneypotDashboard.tsx       # Fake dashboard for intruders
│   ├── SuspiciousActivityLog.tsx   # Intruder log viewer
│   ├── UserManagementModal.tsx
│   └── common/                     # Icons, password strength indicator
├── hooks/
│   └── useKeystrokeDynamics.ts     # Dwell / flight time capture & comparison
├── services/
│   ├── authService.ts              # User storage (localStorage)
│   ├── logService.ts               # Suspicious-activity log storage
│   └── faceApiSimulator.ts         # Simulated facial recognition
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18 or higher
- A device with a webcam
- A modern browser (Chrome recommended – best WebRTC support)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/<your-username>/KeyAuth.git
cd KeyAuth

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open **http://localhost:3000** and allow camera access when asked.

### Other scripts

```bash
npm run build     # production build -> dist/
npm run preview   # preview the production build
```

---

## 🎮 How to Try the Demo

1. **Register** – create a username and password, retype the password 3 times to calibrate your typing rhythm, then capture your reference photos.
2. **Genuine login** – log in typing the password in your normal rhythm → you land on the **Real Dashboard**.
3. **Trigger the honeypot** – log in with the correct password but type very differently (very fast or very slow), then fail the face scan (cover the camera, or tick the *force facial scan failure* checkbox) → you are redirected to the **Honeypot Dashboard**.
4. **Check the log** – log in normally again; the **Suspicious Activity Log** on the real dashboard shows the captured attempt.

---

## 📊 Test Results (from project report)

| Module | Accuracy |
|--------|----------|
| Keystroke matching | 92% |
| Facial matching | 80–90% |
| Dashboard redirection | 100% |
| Logging reliability | 98% |

Average end-to-end authentication time: ~2 seconds.

---

## ⚠️ Limitations (Academic Demo)

This project demonstrates the concept and is **not production-ready**:

- Users and logs are stored in browser `localStorage`; there is no backend or database.
- Passwords are not hashed or salted (a real system must use bcrypt/Argon2 on a server).
- Face recognition is **simulated**, not a real deep-learning model, and has no liveness detection.
- Silent camera capture still depends on the browser's camera permission, and covert capture raises privacy and legal considerations. Real deployments need clear user consent and notice.

---

## 🔮 Future Enhancements

- Machine-learning models for adaptive keystroke matching
- Deep-learning face recognition (CNN / transformer based) with liveness detection
- Real backend + database with hashed credentials
- Cloud-based monitoring and alerting
- Mobile and cross-platform support
- Risk-based authentication (device, location, network)
- Integration with enterprise IAM systems

---

## 👨‍💻 Team

| Name | Register No. |
|------|--------------|
| Anandha Kumar V | 622122111008 |
| Chandru K | 622122111026 |
| Chennakesavan M | 622122111028 |
| Hariharan R S | 622122111049 |

**Supervisor:** Mrs. G. Hemalatha, M.E., Assistant Professor, Department of Cyber Security
**Institution:** Paavai Engineering College (Autonomous), Pachal, Namakkal – 637018
