# 🍽️ MessMate — Student Mess Pre-Order Web App

> A full-stack web application that lets students pre-order meals from their mess, track orders in real time, and manage subscriptions — while giving mess owners complete control over their menu, slots, and operations.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Routes](#api-routes)
- [Roles & Access](#roles--access)
- [Seed Data](#seed-data)
- [License](#license)

---

## Overview

MessMate is a **student mess pre-order system** built for college hostels and PG messes. Students can subscribe to meal plans or place walk-in orders, while mess owners (admins) manage menus, time slots, subscribers, billing, and live order queues — all from a clean, mobile-first dashboard.

---

## ✨ Features

### 👨‍🎓 Student
- Browse and discover mess listings
- Subscribe to monthly meal plans (Gold / Silver / Bronze)
- Place pre-orders in a 3-step flow (menu → slot → confirm)
- Track order status in real time (polling every 15 seconds)
- View order history and notifications
- Rate individual dishes after order completion
- Dark mode toggle

### 🏠 Mess Owner (Admin)
- Dashboard with analytics and revenue insights
- Manage menu items (add / edit / delete)
- Configure time slots for meal pickup
- View and manage live order queue
- Manage subscribers and their plans
- Export billing records as CSV
- Go Live / Pause toggle for the mess
- Edit plan prices

---

## 🛠️ Tech Stack

### Frontend
| Tech | Purpose |
|------|---------|
| React 18 + Vite | UI framework & build tool |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Axios | HTTP client with JWT interceptors |
| Lucide React | Icon library |
| Recharts | Analytics charts |
| Context API | Auth, Order, Theme state management |

### Backend
| Tech | Purpose |
|------|---------|
| Node.js + Express | REST API server (port 5000) |
| SQLite (better-sqlite3) | Embedded database with WAL mode |
| JWT (jsonwebtoken) | Authentication tokens (7-day expiry) |
| bcrypt | Password hashing |
| Razorpay | Payment gateway (UPI / GPay / PhonePe) |

---

## 📁 Project Structure

```
MessMate-Web-App/
├── backend/
│   ├── config/
│   │   ├── db.js               # SQLite connection + WAL mode setup
│   │   └── seed.js             # Database seed data
│   ├── controllers/
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── mess.controller.js
│   │   ├── payment.controller.js
│   │   └── student.controller.js
│   ├── data/
│   │   └── messmate.db         # SQLite database file
│   ├── middleware/
│   │   ├── auth.js             # JWT verification middleware
│   │   ├── errorHandler.js     # Global error handler
│   │   ├── logger.js           # Request logger
│   │   └── roleCheck.js        # Role-based access guard
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── mess.routes.js
│   │   ├── payment.routes.js
│   │   └── student.routes.js
│   ├── utils/
│   │   ├── helpers.js
│   │   └── razorpay.js         # Razorpay instance setup
│   ├── server.js               # Express app entry point
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── favicon.svg
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── AdminLayout.jsx
    │   │   │   └── StudentLayout.jsx
    │   │   └── shared/
    │   │       ├── BottomNav.jsx
    │   │       ├── ConfirmationModal.jsx
    │   │       ├── MessCard.jsx
    │   │       ├── OrderCard.jsx
    │   │       ├── OrderStatusTracker.jsx
    │   │       ├── StatusBadge.jsx
    │   │       ├── SubscriptionPlanCard.jsx
    │   │       ├── ThemeToggle.jsx
    │   │       ├── TimeSlotChip.jsx
    │   │       └── Toast.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── OrderContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── admin/
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── MenuManagement.jsx
    │   │   │   ├── LiveOrderQueue.jsx
    │   │   │   ├── SubscriberManagement.jsx
    │   │   │   ├── PlanManagement.jsx
    │   │   │   ├── SlotSettings.jsx
    │   │   │   ├── BillingRecords.jsx
    │   │   │   └── AdminProfile.jsx
    │   │   ├── auth/
    │   │   │   ├── Splash.jsx
    │   │   │   ├── Login.jsx
    │   │   │   ├── Register.jsx
    │   │   │   └── AdminLogin.jsx
    │   │   └── student/
    │   │       ├── Dashboard.jsx
    │   │       ├── Browse.jsx
    │   │       ├── MessDetail.jsx
    │   │       ├── PreOrderStep1.jsx
    │   │       ├── PreOrderStep2.jsx
    │   │       ├── PreOrderStep3.jsx
    │   │       ├── OrderConfirmation.jsx
    │   │       ├── MyOrders.jsx
    │   │       ├── Subscription.jsx
    │   │       ├── Notifications.jsx
    │   │       └── Profile.jsx
    │   ├── services/
    │   │   └── api.js          # Axios instance with JWT interceptors
    │   ├── App.jsx
    │   └── main.jsx
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm v9+

### 1. Clone the repository

```bash
git clone https://github.com/Abhijeet-109/MessMate-Web-App.git
cd MessMate-Web-App
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory (see [Environment Variables](#environment-variables)).

```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🔐 Environment Variables

Create a `.env` file inside the `backend/` folder:

```env
PORT=5000
JWT_SECRET=your_jwt_secret_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

---

## 📡 API Routes

| Group | Base Path | Description |
|-------|-----------|-------------|
| Auth | `/api/auth` | Register, Login, JWT refresh |
| Mess | `/api/mess` | Browse messes, menu, ratings |
| Student | `/api/student` | Orders, subscriptions, profile |
| Admin | `/api/admin` | Menu CRUD, queue, subscribers, billing |
| Payment | `/api/payment` | Razorpay order creation & webhook |

---

## 👥 Roles & Access

| Role | Description |
|------|-------------|
| **Student – Subscriber** | Monthly plan holder with pre-order access |
| **Student – Walk-in** | Pay-per-order without a subscription |
| **Mess Owner (Admin)** | Full control over mess operations |

JWT tokens carry `role` and `mess_id` in the payload. Role-based access is enforced server-side via the `roleCheck` middleware.

---

## 🌱 Seed Data

The database comes pre-seeded with test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin (Mess Owner) | `owner@annapurna.com` | `admin123` |
| Student | `abhijeet@example.com` | `student123` |

**Mess:** Annapurna Mess, Kothrud, Pune — Rating: 4.5 ⭐

**Test Students:**
- Abhijeet — Gold Pass (18 meals remaining)
- Rohan — Silver Pass (5 meals remaining)
- Priya — Gold Pass (22 meals remaining)
- Amit — Bronze Pass (0 meals remaining)
- Sneha — Gold Pass (15 meals remaining)

---


## 📄 License

This project is built as an academic project for MCA Semester II.  
Not licensed for commercial use.

---

<p align="center">Built with ❤️ by <a href="https://github.com/Abhijeet-109">Abhijeet</a></p>
