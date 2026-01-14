# Database Schema Documentation

This document describes the database schema for the Gym Pad application using PostgreSQL with Prisma ORM.

## Overview

The database consists of 9 main tables that handle user authentication, workout tracking, session templates, and savings goals.

## Database Diagram

```mermaid
erDiagram
    User ||--o{ Session : "has many"
    User ||--o{ Workout : "creates"
    User ||--o{ SavingsGoal : "has"

    Workout ||--o{ Exercise : "contains"
    Workout ||--o{ WorkoutExerciseSwap : "has swaps"

    SessionTemplate ||--o{ TemplateExercise : "defines"

    SavingsGoal ||--o{ SavingsTransaction : "has"

    User {
        int id PK
        string name
        string username UK
        string password
        datetime created_at
    }

    Session {
        string id PK
        int user_id FK
        string token UK
        datetime expires_at
        datetime created_at
    }

    Workout {
        int id PK
        int user_id FK
        int template_id FK
        string title
        datetime date
        int duration
        string notes
        WorkoutStatus status
        datetime created_at
        datetime updated_at
    }

    Exercise {
        int id PK
        int workout_id FK
        string name
        string sets_data
        int rest_seconds
        string notes
        int order_index
        datetime created_at
    }

    SessionTemplate {
        int id PK
        string name UK
        string description
        boolean is_default
        datetime created_at
        datetime updated_at
    }

    TemplateExercise {
        int id PK
        int template_id FK
        string exercise_name
        int default_sets
        int default_reps
        float default_weight
        int order_index
        string notes
        int rest_seconds
        string target_rep_range
        datetime created_at
    }

    ExerciseTemplate {
        int id PK
        string name UK
        string category
        string muscle_groups
        string instructions
        datetime created_at
    }

    WorkoutExerciseSwap {
        int id PK
        int workout_id FK
        string original_exercise_name
        string swapped_exercise_name
        string reason
        datetime created_at
    }

    SavingsGoal {
        int id PK
        int user_id FK
        string name
        float target_amount
        datetime end_date
        datetime created_at
        datetime updated_at
    }

    SavingsTransaction {
        int id PK
        int goal_id FK
        float amount
        TransactionType type
        string note
        datetime date
        datetime created_at
    }
```

## Table Descriptions

### User
Stores user account information and credentials.

**Columns:**
- `id` (Primary Key): Auto-incrementing user identifier
- `name`: Display name for the user
- `username` (Unique): Login username
- `password`: Hashed password
- `created_at`: Account creation timestamp

**Relationships:**
- One-to-many with Session (user sessions)
- One-to-many with Workout (user's workouts)

### Session
Manages user authentication sessions with secure tokens.

**Columns:**
- `id` (Primary Key): CUID session identifier
- `user_id` (Foreign Key): References User.id
- `token` (Unique): Secure session token
- `expires_at`: Token expiration timestamp
- `created_at`: Session creation timestamp

**Relationships:**
- Many-to-one with User (session owner)

### Workout
Stores individual workout sessions.

**Columns:**
- `id` (Primary Key): Auto-incrementing workout identifier
- `user_id` (Foreign Key): References User.id
- `template_id` (Foreign Key, Optional): References SessionTemplate.id
- `title`: Workout session name
- `date`: When the workout was performed
- `duration`: Workout duration in seconds
- `notes`: Optional workout notes
- `status`: Workout status (see WorkoutStatus enum below)
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Relationships:**
- Many-to-one with User (workout owner)
- One-to-many with Exercise (workout exercises)
- One-to-many with WorkoutExerciseSwap (exercise substitutions)

### WorkoutStatus Enum
Defines the possible states of a workout:
- `COMPLETED` - Default state for logged workouts
- `CANCELLED` - Workout was cancelled or skipped
- `DRAFT` - Workout is saved but not yet completed

### Exercise
Stores individual exercises within a workout.

**Columns:**
- `id` (Primary Key): Auto-incrementing exercise identifier
- `workout_id` (Foreign Key): References Workout.id
- `name`: Exercise name (e.g., "Bench Press")
- `sets_data`: JSON string containing set details (reps, weight, completion)
- `rest_seconds`: Rest time between sets
- `notes`: Exercise-specific notes
- `order_index`: Position within the workout
- `created_at`: Record creation timestamp

**Relationships:**
- Many-to-one with Workout (parent workout)

**Sets Data Format:**
```json
[
  {"reps": 10, "weight": 135, "completed": true},
  {"reps": 8, "weight": 140, "completed": true}
]
```

### SessionTemplate
Defines reusable workout templates.

**Columns:**
- `id` (Primary Key): Auto-incrementing template identifier
- `name` (Unique): Template name (e.g., "Push Day")
- `description`: Template description
- `is_default`: Whether this is a default template
- `created_at`: Template creation timestamp
- `updated_at`: Last modification timestamp

**Relationships:**
- One-to-many with TemplateExercise (template exercises)

### TemplateExercise
Defines exercises within a session template.

**Columns:**
- `id` (Primary Key): Auto-incrementing identifier
- `template_id` (Foreign Key): References SessionTemplate.id
- `exercise_name`: Name of the exercise
- `default_sets`: Default number of sets
- `default_reps`: Default number of reps
- `default_weight`: Default weight
- `order_index`: Position within the template
- `notes`: Exercise notes
- `rest_seconds`: Default rest time
- `target_rep_range`: Target rep range (e.g., "8-12")
- `created_at`: Record creation timestamp

**Relationships:**
- Many-to-one with SessionTemplate (parent template)

### ExerciseTemplate
Master list of available exercises with metadata.

**Columns:**
- `id` (Primary Key): Auto-incrementing identifier
- `name` (Unique): Exercise name
- `category`: Exercise category (e.g., "Strength", "Cardio")
- `muscle_groups`: Target muscle groups
- `instructions`: Exercise instructions
- `created_at`: Record creation timestamp

### WorkoutExerciseSwap
Tracks when exercises are substituted during workouts.

**Columns:**
- `id` (Primary Key): Auto-incrementing identifier
- `workout_id` (Foreign Key): References Workout.id
- `original_exercise_name`: Original planned exercise
- `swapped_exercise_name`: Actual performed exercise
- `reason`: Reason for the substitution
- `created_at`: Record creation timestamp

**Relationships:**
- Many-to-one with Workout (parent workout)

### SavingsGoal
Stores user savings goals with target amounts and dates.

**Columns:**
- `id` (Primary Key): Auto-incrementing identifier
- `user_id` (Foreign Key): References User.id
- `name`: Name of the savings goal
- `target_amount`: Target amount to save (in GBP)
- `end_date`: Target date to reach the goal
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Relationships:**
- Many-to-one with User (goal owner)
- One-to-many with SavingsTransaction (goal transactions)

### TransactionType Enum
Defines the type of a savings transaction:
- `DEPOSIT` - Default. Money added to the savings goal (increases balance)
- `WITHDRAWAL` - Money removed from the savings goal (decreases balance)

### SavingsTransaction
Stores individual transactions (deposits/withdrawals) for savings goals.

**Columns:**
- `id` (Primary Key): Auto-incrementing identifier
- `goal_id` (Foreign Key): References SavingsGoal.id
- `amount`: Transaction amount (always positive, type determines direction)
- `type`: Transaction type (see TransactionType enum)
- `note`: Optional note describing the transaction
- `date`: When the transaction occurred
- `created_at`: Record creation timestamp

**Relationships:**
- Many-to-one with SavingsGoal (parent goal)

**Balance Calculation:**
The current balance of a savings goal is calculated as:
```
balance = SUM(DEPOSIT amounts) - SUM(WITHDRAWAL amounts)
```

## Indexes

The following indexes are automatically created by Prisma:

- `User.username` (unique)
- `Session.token` (unique)
- `SessionTemplate.name` (unique)
- `ExerciseTemplate.name` (unique)

## Constraints

### Foreign Key Constraints
- All foreign key relationships include proper referential integrity
- Cascade deletes are configured for dependent records:
  - Deleting a User cascades to Sessions and SavingsGoals
  - Deleting a Workout cascades to Exercises and WorkoutExerciseSwaps
  - Deleting a SessionTemplate cascades to TemplateExercises
  - Deleting a SavingsGoal cascades to SavingsTransactions

### Data Integrity
- Required fields enforce NOT NULL constraints
- Unique constraints prevent duplicate usernames, session tokens, etc.
- Default values are set for timestamps and boolean fields

## Migration History

The database schema has evolved through several migrations:

1. **20250728123707_init**: Initial schema setup
2. **20250731224000_add_auth**: Added authentication
3. **20250731224500_fix_cascade_constraints**: Fixed cascade delete constraints

## Performance Considerations

### Query Optimization
- Foreign key indexes optimize JOIN operations
- Date fields on Workout support time-based queries
- Order indexes on Exercise and TemplateExercise optimize sorting

### Data Storage
- Sets data is stored as JSON for flexibility
- Text fields use appropriate VARCHAR lengths

## Backup and Recovery

### Recommended Practices
- Regular automated backups of the entire database
- Point-in-time recovery capability
- Separate backup of user-generated content (workout data)

### Data Retention
- Session tokens expire automatically
- Historical workout data is preserved indefinitely

## Security Considerations

### Data Protection
- Passwords are hashed before storage
- Session tokens are cryptographically secure
- User data is isolated by user_id foreign keys

### Access Control
- All queries are filtered by authenticated user
- No cross-user data access is possible
- Sensitive fields are not exposed in API responses