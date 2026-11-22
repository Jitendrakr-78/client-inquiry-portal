# Client Inquiry Portal

A full-stack client inquiry management web application built with Node.js, Express, and MySQL (hosted on Clever Cloud), deployed on Render.

## Live Demo
- **App URL:** https://client-inquiry-portal.onrender.com

## Tech Stack
- **Backend:** Node.js, Express
- **Database:** MySQL (`mysql2/promise` on Clever Cloud)
- **Hosting:** Render
- **Version Control:** GitHub

## API Endpoints
- `POST /api/inquiries` — Submit a new client inquiry and generate a reference ID (`REQ-...`)
- `GET /api/inquiries?key=YOUR_ADMIN_KEY` — Fetch all inquiries (protected by admin key)
- `PATCH /api/inquiries/:id/status?key=YOUR_ADMIN_KEY` — Update inquiry status (`Pending`, `In Progress`, `Completed`, `Rejected`)

## Local Setup
1. Install dependencies in `backend`:
   ```bash
   npm install
