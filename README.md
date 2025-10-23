# Feature-Rich Email Onebox

[![Status](https://img.shields.io/badge/status-production-green.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

Live demo: https://project-7q4w8bnfc-abhis-projects-db8c8177.vercel.app/

> A unified "onebox" email aggregator and viewer — synchronizes multiple IMAP accounts, extracts metadata, provides a preview card (onebox), searchable threads, attachments handling, and developer-friendly APIs for automation and intelligence.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Install & Run (Development)](#install--run-development)
- [API Endpoints](#api-endpoints)
- [Frontend](#frontend)
- [Worker / Sync](#worker--sync)
- [Tests](#tests)
- [Deployment](#deployment)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Multi-account IMAP synchronization (real-time or scheduled)
- Rich onebox email preview: sender, subject, snippet, attachments, link preview
- Threaded conversation view and full message view (raw + rendered)
- Search with filters (from, to, subject, date range, has:attachment)
- Attachment download & inline preview (images, PDFs)
- Lightweight built-in IDS/logging for suspicious attachments/links
- Admin & user role separation (optional)
- RESTful API for automation & integrations
- Optional ML/AI features: summarization, entity extraction (pluggable)
- Docker-ready, environment-driven configuration

---

## Tech Stack

- Frontend: React (Vite or Create React App), Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB (Atlas or local)
- Email Protocols: IMAP (node-imap / mailparser), SMTP for sending
- DevOps: Docker, Docker Compose, Vercel (frontend), Heroku / Render / Railway (backend) or your preferred host
- Optional: Redis (caching / job queue), BullMQ / Bee-Queue for workers
- Optional AI: OpenAI / local model for summarization

---

## Architecture

1. **Frontend (React)** — UI/Onebox, login, account linking, search, message view.
2. **Backend (Express)** — REST API, user auth, IMAP connector management, DB persistence.
3. **Worker / Sync service** — Background job to poll IMAP, parse messages, extract metadata, store to DB, run detection/summarization.
4. **Database** — Stores users, accounts, messages, attachments metadata, indexes for search.
5. **Storage** — Local filesystem / S3 for attachments.

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm or yarn
- MongoDB (local or Atlas)
- (Optional) Redis for job queue
- (Optional) Docker & Docker Compose

### Environment Variables

Create `.env` files for backend and worker. Example:

**Backend `.env`**
