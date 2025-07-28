# Gym Pad - Fullstack Workout Tracker

A modern fullstack workout tracking application built with Next.js. Track your gym sessions, monitor exercise progress, and visualize your fitness journey with persistent data storage and real-time analytics.

## Features

- **Workout Sessions**: Create, view, and organize workout sessions with persistent storage
- **Exercise Tracking**: Track sets, reps, and weights for each exercise with database persistence
- **Progress History**: View detailed exercise history with interactive progress charts
- **Interactive Dashboard**: Clean, modern interface with dark theme
- **Exercise Analytics**: Visual progress tracking with charts and trends over time
- **Real-time Data**: Automatic data sync and caching with SWR
- **API-Driven**: Full REST API for all workout and exercise operations

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: JavaScript (ES modules)
- **UI**: React 19 with modern hooks
- **Styling**: Tailwind CSS v4 for responsive design
- **Icons**: Lucide React for beautiful icons
- **Charts**: Recharts for progress visualization
- **Data Fetching**: SWR for real-time data sync and caching

### Backend
- **API**: Next.js API routes with full CRUD operations
- **Database**: SQLite with Prisma ORM (production-ready for PostgreSQL)
- **Validation**: Custom validation functions with PropTypes
- **Data**: Persistent storage with relationships

### Deployment
- **Platform**: Optimized for Vercel deployment
- **Database**: Easy migration to Vercel Postgres for production

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Seed database (optional):
   ```bash
   node lib/seed.js
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

- `GET /api/workouts` - Get all workouts
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/[id]` - Get specific workout
- `PUT /api/workouts/[id]` - Update workout
- `DELETE /api/workouts/[id]` - Delete workout
- `GET /api/exercises/history/[name]` - Get exercise history

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables for production database
3. Deploy automatically on push to main branch

### Environment Variables
```env
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Migration from Vite

This project was successfully migrated from React + Vite to Next.js fullstack. See `migration_plan.md` for detailed migration documentation.

## Goals

- ✅ Provide an intuitive interface for gym enthusiasts to track their workouts
- ✅ Enable data-driven fitness progress through visual analytics  
- ✅ Create a responsive, mobile-friendly experience for on-the-go tracking
- ✅ Build a foundation with persistent data storage and full CRUD operations
- 🔄 Add user authentication and multi-user support
- 🔄 Implement workout planning and program templates
- 🔄 Add social sharing and workout community features
