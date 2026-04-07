# UChicago Help Desk — Incident Reporting Application

A minimal incident reporting web application for UChicago campus. Students and staff can submit incidents via a public form, and administrators can review, prioritize, and manage them through a protected dashboard.

## Tech Stack

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: SQLite (via sql.js)
- **Styling**: UChicago brand theme (Maroon #800000)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install all dependencies (root, server, client)
npm run install:all
```

### Configuration

Copy the example env file and configure:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `ADMIN_PASSWORD` | `changeme` | Password for admin dashboard access |
| `PORT` | `3001` | Express server port |

### Running in Development

```bash
# Start both server and client concurrently
npm run dev
```

Or run them separately:

```bash
# Terminal 1 — Backend (port 3001)
cd server && npm run dev

# Terminal 2 — Frontend (port 5173)
cd client && npm run dev
```

Then open http://localhost:5173

## Features

### Public Incident Form (`/`)
- Submit incidents with: name, email, date, location, category, priority suggestion, and description
- Client-side validation with user-friendly error messages
- Success confirmation after submission

### Admin Dashboard (`/admin`)
- Password-protected access
- View all incidents in a sortable table
- Sort by any column (click column headers)
- Filter by status (Open, In Progress, Resolved) and category (IT, Facility, Security, Other)
- Override submitter priority (admin priority takes precedence)
- Update incident status inline
- Color-coded priority badges (Critical=red, High=orange, Medium=yellow, Low=green)

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/incidents` | No | List incidents (supports `?sort=`, `?order=`, `?status=`, `?category=`) |
| `POST` | `/api/incidents` | No | Create a new incident |
| `POST` | `/api/admin/login` | No | Authenticate with admin password |
| `PATCH` | `/api/admin/incidents/:id` | Bearer token | Update incident status/priority |

## Project Structure

```
campus-incidents-new/
├── client/                    # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── IncidentForm.jsx
│   │   │   ├── AdminPage.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── Navbar.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── vite.config.js
├── server/                    # Express backend
│   ├── routes/
│   │   ├── incidents.js
│   │   └── admin.js
│   ├── db.js
│   └── index.js
├── .env                       # Environment variables
└── README.md
```
