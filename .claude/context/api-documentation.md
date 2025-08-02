# Gym Pad API Documentation

## Overview

This document provides comprehensive documentation for the Gym Pad application's API endpoints, database structure, and frontend development guidelines.

## Database Structure

The application uses PostgreSQL with Prisma ORM. The database consists of the following main models:

### Models

#### User (`users` table)
- `id` (Int) - Primary key, auto-increment
- `email` (String) - Unique email address
- `name` (String) - User's display name
- `createdAt` (DateTime) - Account creation timestamp

#### Workout (`workouts` table)
- `id` (Int) - Primary key, auto-increment
- `userId` (Int) - Foreign key to users table (optional)
- `title` (String) - Workout title/name
- `date` (DateTime) - When the workout was performed
- `duration` (Int) - Duration in minutes (optional)
- `notes` (String) - Additional notes (optional)
- `createdAt` (DateTime) - Record creation timestamp
- `updatedAt` (DateTime) - Last update timestamp

#### Exercise (`exercises` table)
- `id` (Int) - Primary key, auto-increment
- `workoutId` (Int) - Foreign key to workouts table
- `name` (String) - Exercise name
- `sets` (Int) - Number of sets performed
- `reps` (Int) - Number of repetitions per set
- `weight` (Float) - Weight used (optional, supports decimals)
- `restSeconds` (Int) - Rest time between sets in seconds (optional)
- `notes` (String) - Exercise-specific notes (optional)
- `orderIndex` (Int) - Order of exercise within workout
- `createdAt` (DateTime) - Record creation timestamp

#### ExerciseTemplate (`exercise_templates` table)
- `id` (Int) - Primary key, auto-increment
- `name` (String) - Unique exercise name
- `category` (String) - Exercise category (optional)
- `muscleGroups` (String) - JSON string of muscle groups (optional)
- `instructions` (String) - Exercise instructions (optional)
- `createdAt` (DateTime) - Record creation timestamp

## Database Management

### Making Schema Changes

1. **Update the Prisma schema**: Edit `prisma/schema.prisma`
2. **Generate migration**: Run `npx prisma migrate dev --name your_migration_name`
3. **Generate client**: Run `npx prisma generate`
4. **Apply to production**: Run `npx prisma migrate deploy`

### Seeding Data

To populate the database with sample data:

```bash
node lib/seed.js
```

The seed script clears existing workout and exercise data and creates sample workouts with exercises.

### Prisma Commands

- **View database**: `npx prisma studio`
- **Reset database**: `npx prisma migrate reset`
- **Deploy migrations**: `npx prisma migrate deploy`
- **Generate client**: `npx prisma generate`

## API Endpoints

### Workouts

#### GET /api/workouts
Get all workouts with exercises included.

**Response:**
```json
[
  {
    "id": 1,
    "title": "Upper Body Focus",
    "date": "2023-11-15T00:00:00.000Z",
    "duration": 45,
    "notes": null,
    "exercises": [
      {
        "id": 1,
        "name": "Bench Press",
        "sets": 4,
        "reps": 8,
        "weight": 185,
        "orderIndex": 0
      }
    ]
  }
]
```

#### POST /api/workouts
Create a new workout.

**Request Body:**
```json
{
  "title": "My Workout",
  "date": "2023-11-20",
  "duration": 60,
  "notes": "Good session"
}
```

**Response:** Returns created workout with 201 status.

#### GET /api/workouts/[id]
Get a specific workout by ID.

**Response:** Single workout object with exercises.

#### PUT /api/workouts/[id]
Update a specific workout.

**Request Body:** Same as POST /api/workouts

**Response:** Updated workout object.

#### DELETE /api/workouts/[id]
Delete a specific workout.

**Response:**
```json
{
  "message": "Workout deleted successfully"
}
```

### Exercises

#### GET /api/exercises
Get all exercises or exercises for a specific workout.

**Query Parameters:**
- `workoutId` (optional) - Filter exercises by workout ID

**Response:**
```json
[
  {
    "id": 1,
    "workoutId": 1,
    "name": "Bench Press",
    "sets": 4,
    "reps": 8,
    "weight": 185,
    "restSeconds": null,
    "notes": null,
    "orderIndex": 0,
    "workout": {
      "id": 1,
      "title": "Upper Body Focus",
      "date": "2023-11-15T00:00:00.000Z"
    }
  }
]
```

#### POST /api/exercises
Create a new exercise.

**Request Body:**
```json
{
  "workoutId": 1,
  "name": "Bench Press",
  "sets": 4,
  "reps": 8,
  "weight": 185,
  "restSeconds": 90,
  "notes": "Good form",
  "orderIndex": 0
}
```

**Response:** Returns created exercise with 201 status.

#### GET /api/exercises/history/[name]
Get exercise history by exercise name.

**Response:**
```json
[
  {
    "date": "2023-11-15",
    "sets": 4,
    "reps": 8,
    "weight": 185,
    "workoutTitle": "Upper Body Focus"
  }
]
```

### Stats

The `/api/stats` endpoint directory exists but is currently empty. This is where workout statistics endpoints would be implemented.

## Data Validation

The application uses custom validation functions located in `lib/validations.js`:

### Workout Validation
- `title`: Required, non-empty string
- `date`: Valid date format
- `duration`: Optional positive integer

### Exercise Validation
- `name`: Required, non-empty string
- `sets`: Required positive integer
- `reps`: Required positive integer
- `weight`: Optional non-negative number
- `orderIndex`: Optional non-negative integer

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "details": ["Validation error details"]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `500` - Internal Server Error

## Frontend Development

### Project Structure

The frontend is built with Next.js 15 and uses the App Router pattern:

- `/app/page.js` - Main homepage component
- `/app/layout.js` - Root layout component
- `/components/` - Reusable React components
- `/lib/` - Utility functions and Prisma client

### Available Routes

- `/` - Main dashboard showing workouts and exercises

### Key Components

- **Header** (`components/Header.jsx`) - Navigation header
- **Dashboard** (`components/Dashboard.jsx`) - Main workout dashboard
- **SessionCard** (`components/SessionCard.jsx`) - Individual workout display
- **ExerciseItem** (`components/ExerciseItem.jsx`) - Exercise display within workouts
- **HistoryModal** (`components/HistoryModal.jsx`) - Exercise history popup
- **ProgressChart** (`components/ProgressChart.jsx`) - Progress visualization

### Data Fetching

The application uses SWR for data fetching:

```javascript
import useSWR from 'swr'

const { data: workouts, error, isLoading } = useSWR('/api/workouts', fetcher)
```

### Styling

- **CSS Framework**: Tailwind CSS v4
- **Design System**: Dark theme with gray color palette
- **Responsive**: Mobile-first responsive design

### Making Frontend Changes

1. **Adding new components**: Create in `/components/` directory
2. **Adding new pages**: Create in `/app/` directory following App Router conventions
3. **Styling**: Use Tailwind CSS classes, following existing dark theme patterns
4. **State management**: Use React hooks and SWR for server state
5. **API calls**: Use the existing fetcher pattern with SWR

### Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

Create a `.env` file based on `.env.example`:

```
DATABASE_URL="postgresql://user:password@host:port/database"
```

## Dependencies

### Key Dependencies
- **Next.js 15** - React framework
- **Prisma** - Database ORM
- **Tailwind CSS v4** - Styling
- **SWR** - Data fetching
- **React Hook Form** - Form handling
- **Recharts** - Charts and data visualization
- **Lucide React** - Icon library

## Testing

The project structure suggests testing should be added. Consider adding:
- Unit tests for API endpoints
- Component tests for React components
- Integration tests for database operations