# 🧩 Dashboard E-commerce | Admin Command Center

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Real--time-FFCA28?style=flat&logo=firebase)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://dashboard-ecommerce-lyart.vercel.app/)

A high-performance, responsive admin dashboard tailored for modern e-commerce management. Built with **Next.js**, **Firebase**, and **Tailwind CSS**, this platform provides a seamless experience for managing orders, finances, products, and customer relationships.

---

## 🚀 Core Features

### 📊 Financial Command Center
- **Revenue Tracking**: Distinguish between online and cash-on-delivery revenue in real-time.
- **Expense Management**: Categorize and track all business expenditures with detailed logs.
- **Profit Analytics**: Automated monthly profit/loss calculations with interactive charts (**Chart.js**).
- **Smart Insights**: AI-driven (pre-calculated) insights on financial health and trends.

### 📦 Order & Inventory Management
- **Advanced Payment Workflow**: Support for partial payments (deposits) and final balance collection.
- **Real-Time Statuses**: Track orders from 'Pending' and 'Confirmed' to 'Shipped' and 'Delivered'.
- **Inventory Tracking**: Manage stock levels, categories, and upload optimized product images.
- **Notification System**: Instant browser sounds and alerts for new orders via **Firebase Cloud Messaging**.

### 👥 CRM & User Governance
- **Role-Based Access Control (RBAC)**: Secure routes for Super Admins, Admins, and Editors using **Firebase Admin SDK**.
- **Customer Insights**: Detailed database of customer history and behavior.
- **Leads Management**: Track potential sales and convert leads into customers.

### 📧 Automated Communications
- **Order Notifications**: Automated HTML emails sent to customers upon checkout and status updates using **Nodemailer**.
- **Admin Alerts**: Immediate notification to management for critical system events.

---

## ⚙️ Tech Stack

- **Frontend**: [Next.js](https://nextjs.org/) (App Router), React 19, Redux Toolkit
- **Styling**: [Tailwind CSS 4.x](https://tailwindcss.com/), PostCSS
- **Backend-as-a-Service**: [Firebase](https://firebase.google.com/) (Firestore, Auth, Messaging)
- **Server-Side**: Firebase Admin SDK
- **Data Visualization**: [Chart.js](https://www.chartjs.org/) & `react-chartjs-2`
- **Email Service**: [Nodemailer](https://nodemailer.com/)
- **Image Processing**: `browser-image-compression`

---

## 📂 Project Structure

```text
src/
├── app/               # Next.js App Router (Finance, Orders, Analytics, etc.)
├── components/        # Reusable UI components & Role Guards
├── redux/            # Global state management using Redux Toolkit
├── styles/           # Global CSS and Tailwind configurations
├── firebaseConfig.js # Client-side Firebase initialization
└── firebaseAdmin.js  # Server-side Firebase Admin SDK config
```

---

## 🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/AbdelrhmanShehab/Dashboard-ecommerce.git
   cd Dashboard-ecommerce
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env.local` file with the following:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   FIREBASE_PROJECT_ID=...
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
   EMAIL_USER=...
   EMAIL_PASSWORD=...
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## 🔗 Links

- **Main Project Repository**: [GitHub](https://github.com/AbdelrhmanShehab/Dashboard-ecommerce)
- **Frontend Project**: [Frontend Github](https://github.com/AbdelrhmanShehab/hedoomyy)
- **Live Deployment**: [Dashboard E-commerce](https://dashboard-ecommerce-lyart.vercel.app/)
- **Watch Demo**: [Live Video Run](https://drive.google.com/file/d/1MrXd8iQpSULdsQ6gW_NU6uJH3kE6Hz_7/view?usp=sharing)

---

**Author**: [Abdelrhman Hossam](https://github.com/AbdelrhmanShehab)
