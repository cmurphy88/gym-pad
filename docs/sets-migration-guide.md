# Sets Array Migration Guide

This guide covers the migration from the old exercise format (single sets/reps/weight) to the new sets array format that supports individual set tracking.

## Overview

**Old Format:**
```json
{
  "name": "Bench Press",
  "sets": 4,
  "reps": 8,
  "weight": 185
}
```

**New Format:**
```json
{
  "name": "Bench Press",
  "sets": [
    { "weight": 185, "reps": 8 },
    { "weight": 185, "reps": 8 },
    { "weight": 185, "reps": 7 },
    { "weight": 185, "reps": 6 }
  ]
}
```

## Migration Steps

### 1. Backup Your Database
```bash
cp prisma/dev.db prisma/dev.db.backup
```

### 2. Run the Database Migration
```bash
# Generate the migration
npx prisma migrate dev --name convert-sets-to-array

# Generate the Prisma client
npx prisma generate
```

### 3. Migrate Existing Data (Optional)
If you have existing data to migrate:
```bash
node lib/migrate-sets.js
```

### 4. Seed Fresh Data
```bash
node lib/seed.js
```

### 5. Test the API
Start the development server and test the endpoints:
```bash
npm run dev
```

## API Changes

### Exercise Creation
**Old API Call:**
```javascript
POST /api/exercises
{
  "workoutId": 1,
  "name": "Bench Press",
  "sets": 4,
  "reps": 8,
  "weight": 185,
  "orderIndex": 0
}
```

**New API Call:**
```javascript
POST /api/exercises
{
  "workoutId": 1,
  "name": "Bench Press",
  "sets": [
    { "weight": 185, "reps": 8 },
    { "weight": 185, "reps": 8 },
    { "weight": 185, "reps": 7 },
    { "weight": 185, "reps": 6 }
  ],
  "orderIndex": 0
}
```

### API Response Format
All API endpoints now return exercises with the `sets` array:
```javascript
{
  "id": 1,
  "workoutId": 1,
  "name": "Bench Press",
  "sets": [
    { "weight": 185, "reps": 8 },
    { "weight": 185, "reps": 8 },
    { "weight": 185, "reps": 7 },
    { "weight": 185, "reps": 6 }
  ],
  "orderIndex": 0,
  "createdAt": "2023-11-15T10:00:00.000Z"
}
```

### Exercise History Endpoint
The `/api/exercises/history/[name]` endpoint now returns:
```javascript
[
  {
    "date": "2023-11-15",
    "sets": [
      { "weight": 185, "reps": 8 },
      { "weight": 185, "reps": 8 },
      { "weight": 185, "reps": 7 },
      { "weight": 185, "reps": 6 }
    ],
    "totalSets": 4,
    "totalReps": 29,
    "maxWeight": 185,
    "totalVolume": 5365,
    "workoutTitle": "Upper Body Focus"
  }
]
```

## Database Schema Changes

### Before (Old Schema)
```prisma
model Exercise {
  id          Int     @id @default(autoincrement())
  workoutId   Int     @map("workout_id")
  name        String
  sets        Int
  reps        Int
  weight      Float?
  restSeconds Int?    @map("rest_seconds")
  notes       String?
  orderIndex  Int     @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")
  workout     Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)

  @@map("exercises")
}
```

### After (New Schema)
```prisma
model Exercise {
  id          Int     @id @default(autoincrement())
  workoutId   Int     @map("workout_id")
  name        String
  setsData    String  @map("sets_data") // JSON string storing array of sets
  restSeconds Int?    @map("rest_seconds")
  notes       String?
  orderIndex  Int     @map("order_index")
  createdAt   DateTime @default(now()) @map("created_at")
  workout     Workout @relation(fields: [workoutId], references: [id], onDelete: Cascade)

  @@map("exercises")
}
```

## Validation Changes

The exercise validation now checks for a sets array:
- `sets` must be a non-empty array
- Each set must have `reps` (positive integer)
- Each set can optionally have `weight` (non-negative number)

## Frontend Changes

### ExerciseItem Component
Now displays sets in a smart format:
- If all sets are identical: "4 sets × 8 reps · 185 lbs"
- If sets vary: "4 sets: 185×8, 185×8, 185×7, 185×6"

### HistoryModal Component
- Shows individual sets in a grid layout
- Displays max weight and total volume
- Maintains backwards compatibility

### ProgressChart Component
- Tracks max weight per exercise session
- Can be extended to show volume or other metrics

## Utility Functions

The migration includes several utility functions in `lib/migrate-sets.js`:

### `parseSetsData(setsDataJson)`
Parses JSON string to sets array.

### `calculateExerciseSummary(sets)`
Returns summary statistics:
```javascript
{
  totalSets: 4,
  totalReps: 29,
  maxWeight: 185,
  totalVolume: 5365
}
```

### `convertExerciseFormat(oldExercise)`
Converts old format exercise to new format.

## Troubleshooting

### Migration Issues
If migration fails:
1. Restore from backup: `cp prisma/dev.db.backup prisma/dev.db`
2. Check database permissions
3. Verify Prisma client is up to date

### API Errors
If getting validation errors:
- Ensure `sets` is an array, not a number
- Check that each set has required `reps` field
- Verify `weight` is a number, not a string

### Frontend Issues
If components aren't displaying correctly:
- Check that `exercise.sets` is an array
- Verify PropTypes are updated
- Check browser console for errors

## Testing

Test the following scenarios:
1. Create new exercise with sets array
2. View exercise in workout list
3. View exercise history
4. Check progress chart
5. Verify API responses match expected format

## Rollback Plan

If you need to rollback:
1. Restore database backup: `cp prisma/dev.db.backup prisma/dev.db`
2. Revert code changes using git
3. Regenerate Prisma client: `npx prisma generate`

## Benefits of New Format

1. **Individual Set Tracking**: Track weight/reps for each set
2. **Progressive Overload**: Better track progression within a workout
3. **Flexible Training**: Support for drop sets, pyramid sets, etc.
4. **Better Analytics**: More detailed workout analysis
5. **Realistic Data**: Reflects how people actually train

## Future Enhancements

The new format enables:
- Rest time tracking per set
- RPE (Rate of Perceived Exertion) per set
- Tempo tracking
- Failure point analysis
- Advanced workout analytics