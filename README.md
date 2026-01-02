# Gym Pad - Fullstack Workout Tracker

A modern fullstack workout tracking application built with Next.js. Track your gym sessions, monitor exercise progress, and visualize your fitness journey with persistent data storage and real-time analytics.

## Features

### Core Workout Tracking
- **Workout Sessions**: Create, view, and organize workout sessions with persistent storage
- **Exercise Tracking**: Track sets, reps, and weights for each exercise with database persistence
- **RPE System**: Rate of Perceived Exertion tracking (1-10 scale) with color-coded effort levels
- **Smart Templates**: Create and use workout templates for quick session setup
- **Exercise History**: View complete history for any exercise with all past performances

### Personal Records (PR) Tracking
- **Automatic PR Detection**: PRs are automatically detected when you complete a workout
- **Multiple PR Types**: Track 1RM (one-rep max), volume PRs, rep PRs, and estimated 1RM
- **PR Badges**: Visual badges on exercises that set new records
- **Celebration Modal**: Animated celebration when new PRs are achieved
- **PR History**: View all-time PRs for each exercise in the history modal

### Progressive Overload Suggestions
- **RPE-Based Recommendations**: Intelligent weight/rep suggestions based on RPE trends
- **Progression Status**: Exercises categorized as "Ready to Progress", "On Track", or "Needs Attention"
- **Template Prefill**: See progression badges when starting a workout from a template
- **Insights Dashboard**: Dedicated page showing progression status for all exercises

### Volume Analytics
- **Weekly Volume Trends**: Area chart showing total training volume over the last 8 weeks
- **Muscle Group Breakdown**: Bar chart showing this week's volume by muscle group
- **Training Balance**: Push/Pull and Upper/Lower balance indicators with imbalance warnings
- **User-Defined Muscle Groups**: Assign muscle groups to exercises in template editor

### Additional Features
- **Calendar View**: Visual calendar showing workout history by date
- **Progress Charts**: Interactive line charts showing weight progression over time
- **Dark Theme**: Modern, eye-friendly dark interface
- **Real-time Sync**: Automatic data sync and caching with SWR
- **Mobile Responsive**: Optimized for both desktop and mobile use

## Pages

| Page | Path | Description |
|------|------|-------------|
| **Dashboard** | `/` | Main landing page with recent workouts and quick actions |
| **New Session** | `/new-session` | Create a new workout session (blank or from template) |
| **Session Detail** | `/session/[id]` | View and edit a specific workout session |
| **Training Insights** | `/insights` | Progression suggestions and volume analytics dashboard |
| **Templates** | `/templates` | Manage workout templates |
| **New Template** | `/templates/new` | Create a new workout template |
| **Edit Template** | `/templates/[id]/edit` | Edit an existing template |

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
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Session-based auth with HTTP-only cookies
- **Validation**: Custom validation functions with PropTypes

### Deployment

- **Platform**: Optimized for Vercel deployment
- **Database**: PostgreSQL (Neon, Vercel Postgres, or any provider)

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Setup environment variables:

   ```bash
   cp .env.example .env
   # Edit .env with your DATABASE_URL
   ```

3. Setup database:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. Seed database with templates (optional):

   ```bash
   npm run seed
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Documentation

- 📚 **[API Documentation](docs/API.md)** - Complete API reference
- 🏗️ **[Architecture](docs/ARCHITECTURE.md)** - System architecture and data flow
- 🗄️ **[Database Schema](docs/DATABASE.md)** - Entity relationships and schema
- 🚀 **[Deployment Guide](docs/DEPLOYMENT.md)** - Deployment instructions
- 🤝 **[Contributing](docs/CONTRIBUTING.md)** - Development guidelines

## API Endpoints

### Workouts
- `GET /api/workouts` - List all workouts
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/[id]` - Get specific workout
- `PUT /api/workouts/[id]` - Update workout
- `DELETE /api/workouts/[id]` - Delete workout
- `GET /api/workouts/calendar` - Get calendar data

### Exercises
- `GET /api/exercises` - List unique exercise names
- `GET /api/exercises/history/[name]` - Get exercise history

### Templates
- `GET /api/templates` - List all templates
- `POST /api/templates` - Create new template
- `GET /api/templates/[id]` - Get specific template
- `PUT /api/templates/[id]` - Update template
- `DELETE /api/templates/[id]` - Delete template
- `GET /api/templates/[id]/latest-data` - Get prefill data

### Insights
- `GET /api/insights` - Get progression suggestions and volume analytics

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

## Project Structure

```text
gym-pad/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── insights/          # Insights page
│   ├── new-session/       # New workout page
│   ├── session/[id]/      # Session detail page
│   └── templates/         # Template management pages
├── components/            # React components
│   ├── Dashboard.jsx      # Main dashboard
│   ├── SessionForm.jsx    # Workout form
│   ├── InsightsDashboard.jsx  # Insights view
│   ├── VolumeCharts.jsx   # Volume analytics charts
│   ├── PRBadge.jsx        # PR indicator badge
│   ├── ProgressionBadge.jsx   # Progression status badge
│   └── ...
├── lib/                   # Utility functions
│   ├── pr-calculations.js     # PR detection logic
│   ├── progression-suggestions.js  # Progression logic
│   ├── volume-analytics.js    # Volume calculations
│   └── ...
├── contexts/              # React contexts
├── prisma/                # Database schema
├── docs/                  # Documentation
└── tests/                 # Test files
```

## Environment Variables

```env
# PostgreSQL Database URL (required)
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Roadmap

- ✅ Core workout tracking with RPE
- ✅ Workout templates with prefill
- ✅ Exercise history and progress charts
- ✅ PR tracking with celebration
- ✅ Progressive overload suggestions
- ✅ Volume analytics with muscle groups
- ✅ User authentication
- 🔲 Rest timer between sets
- 🔲 Workout streaks and consistency tracking
- 🔲 Data export (CSV/JSON)
- 🔲 PWA/Offline support

## License

ISC
