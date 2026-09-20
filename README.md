# BD Legal Guide AI - Frontend

This directory contains the React-based frontend for the BD Legal Guide AI platform. It is a modern, responsive, dark-themed web application designed to connect clients, lawyers, and law firms with AI-powered legal assistance.

## 🛠 Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS (v4)
- **Routing:** React Router DOM (v7)
- **State Management:** Zustand (for Auth, Admin RBAC, and Booking state)
- **Authentication:** Clerk (`@clerk/clerk-react`) with dark theme overrides
- **Icons:** `lucide-react`
- **Charts:** `recharts` (customized for dark mode)

## ✨ Key Features (Frontend)

- **Role-Based Workspaces:** Distinct UI and dashboards for **Clients**, **Lawyers**, **Firms**, and **Admins**.
- **Admin RBAC Portal:** A granular role-based access control system distinguishing between Superusers (`ADMIN`) and Scoped Staff (`MODERATOR`), featuring an immutable Audit Log.
- **AI Chat Interface:** Renders rich markdown, citation chips, and contextual triage cards based on AI responses.
- **Lawyer Directory & Booking:** Browse verified advocates, view availability matrices, and book consultations.
- **Strict Legal-Tech Dark Theme:** A cohesive, premium dark aesthetic using Zinc and specific role accent colors (Blue for Clients, Amber for Lawyers, Violet for Firms).

## 🎭 Demo Mode

For presentation and viva purposes, the app includes a **Demo Role Switcher**.

When `VITE_DEMO_MODE=true` is set in your `.env` file, a floating widget appears in the bottom right corner of the screen. This allows you to instantly bypass authentication and switch between:
1. Client View
2. Lawyer Dashboard
3. Firm Dashboard
4. Admin / Moderator (with a dropdown to select deterministic staff members to demonstrate scope-based route guards).

*Note: All data in Demo Mode is mocked locally via `setTimeout` functions to ensure zero risk of API failures during live presentations.*

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the `frontend` root:
```env
VITE_API_URL=http://localhost:8000/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_DEMO_MODE=true
```

### 3. Run Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.
