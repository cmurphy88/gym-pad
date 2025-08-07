# Gym Pad - Fullstack Workout Tracker

See @README.md for complete project overview and @package.json for available npm commands.

## Project Architecture & Documentation

- Architecture: @docs/ARCHITECTURE.md
- API Documentation: @docs/API.md  
- Database Schema: @docs/DATABASE.md
- Database Schema Definition: @prisma/schema.prisma
- Deployment Guide: @docs/DEPLOYMENT.md
- Contributing Guidelines: @docs/CONTRIBUTING.md

## Tech Stack Summary

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, SWR
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Key Features**: RPE tracking, auto-regulation, exercise templates, progress analytics
- **Deployment**: Vercel-optimized with database migrations

## Development Commands

**Primary Commands:**
- `npm run dev` - Start development server
- `npm run build` - Production build with Prisma generate
- `npm run build:production` - Production build with migrations
- `npm run lint` - Run Next.js linting
- `npm run seed` - Seed database with templates

**Database Commands:**
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma studio` - Open Prisma Studio GUI
- `npx prisma db seed` - Run database seeding

## Code Conventions & Standards

### File Structure Patterns
```
app/
├── api/[feature]/route.js     # API endpoints
├── [feature]/page.js          # Page components
└── [feature]/[id]/page.js     # Dynamic routes

components/
├── FeatureName.jsx            # PascalCase components
├── feature-specific/          # Grouped by domain

lib/
├── feature.js                 # Utility functions
└── validations.js             # Input validation
```

### Component Conventions
- Use functional components with hooks
- PascalCase for component names
- Props validation with PropTypes
- SWR for data fetching: `useSWR('/api/endpoint', fetcher)`
- Tailwind CSS for all styling
- Lucide React for icons

### API Route Patterns
- RESTful endpoints (GET, POST, PUT, DELETE)
- Authentication middleware: `import { requireAuth } from '@/lib/middleware'`
- Validation: `import { validateWorkout } from '@/lib/validations'`
- Consistent error handling with proper HTTP status codes
- User-scoped data access (filter by user.id)

### Database Patterns
- Use Prisma client: `import { prisma } from '@/lib/prisma'`
- Always include user relationship for data isolation
- Proper error handling for database operations
- Use transactions for complex operations

## Key API Endpoints

**Authentication:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration  
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

**Workouts:**
- `GET /api/workouts` - List user workouts
- `POST /api/workouts` - Create new workout
- `GET /api/workouts/[id]` - Get specific workout
- `PUT /api/workouts/[id]` - Update workout
- `DELETE /api/workouts/[id]` - Delete workout

**Exercise History:**
- `GET /api/exercises/history/[name]` - Get exercise progression data

**Templates:**
- `GET /api/templates` - List workout templates
- `POST /api/templates` - Create new template
- `GET /api/templates/[id]/latest-data` - Get exercise prefill data

**Weight Tracking:**
- `GET /api/weight` - Get weight history
- `POST /api/weight` - Add weight entry
- `GET /api/weight/goal` - Get weight goal

## Component Architecture

**Core Components:**
- `Dashboard.jsx` - Main application dashboard
- `SessionForm.jsx` - Workout creation/editing
- `SessionDetail.jsx` - Workout display and management
- `ExerciseItem.jsx` - Individual exercise component with RPE
- `ProgressChart.jsx` - Exercise history visualization
- `WeightTracker.jsx` - Weight monitoring interface
- `TemplateEditor.jsx` - Template creation/editing
- `AuthForm.jsx` - Login/registration forms

**Key Features:**
- RPE (Rate of Perceived Exertion) scale 1-10 with color coding
- Auto-regulation: weight/rep suggestions based on RPE history
- Template-specific prefill prevents exercise data contamination
- Real-time progress charts with Recharts

## Authentication Context

- Use `AuthContext` from `@/contexts/AuthContext`
- Session-based auth with HTTP-only cookies
- Middleware protection for authenticated routes
- User data available via `useAuth()` hook

## Common Patterns

**Data Fetching:**
```javascript
import useSWR from 'swr'
const { data, error, mutate } = useSWR('/api/workouts', fetcher)
```

**Form Handling:**
```javascript
import { useForm } from 'react-hook-form'
const { register, handleSubmit, formState: { errors } } = useForm()
```

**Database Queries:**
```javascript
const workouts = await prisma.workout.findMany({
  where: { userId: user.id },
  include: { exercises: true }
})
```

## Quality Assurance

**Before Committing:**
1. Run `npm run lint` to ensure code quality
2. Test API endpoints with proper authentication
3. Verify database operations don't leak user data
4. Ensure responsive design works on mobile
5. Check that SWR cache invalidates properly after mutations

**Security Checklist:**
- All API routes require authentication (except auth endpoints)
- Database queries filter by user.id
- Input validation on all form submissions
- Proper error handling without exposing internals
- HTTPS-only cookies for sessions

## Performance Notes

- Use SWR for client-side caching and real-time updates
- Implement proper loading states for better UX
- Optimize database queries with appropriate includes/selects
- Use Next.js Image component for any images
- Lazy load components where appropriate

## Common File Paths

**Configuration:**
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind customization
- `jsconfig.json` - JavaScript configuration

**Key Utilities:**
- `lib/auth.js` - Authentication helpers
- `lib/prisma.js` - Database client
- `lib/validations.js` - Input validation functions
- `lib/middleware.js` - API middleware

## Development Workflow

1. **Feature Development**: Create API route → Create/update components → Test with SWR
2. **Database Changes**: Update schema → Generate migration → Test locally → Deploy
3. **Authentication**: Always test both authenticated and unauthenticated states
4. **Testing**: Use development server with `npm run dev` for hot reload

## Notes

- This is a single-user application transitioning to multi-user
- RPE system is core to the workout tracking methodology
- Template system prevents exercise data contamination between different workout types
- All timestamps should be handled in UTC and converted to local time in UI
- Weight tracking includes goal setting and progress monitoring

## Troubleshooting

**Common Issues:**
- Database connection: Check DATABASE_URL environment variable
- Prisma client: Run `npx prisma generate` if getting import errors
- SWR cache: Use `mutate()` to refresh data after mutations
- Authentication: Clear cookies and restart dev server if session issues occur