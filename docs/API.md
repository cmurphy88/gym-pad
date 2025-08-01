# Gym Pad API Documentation

This document provides comprehensive documentation for all API endpoints in the Gym Pad application.

## Base URL
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication

The application uses session-based authentication with HTTP-only cookies.

### Auth Endpoints

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "password": "string", 
  "name": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "string",
    "name": "string"
  }
}
```

#### POST /api/auth/login
Login with existing credentials.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "string", 
    "name": "string"
  }
}
```

#### POST /api/auth/logout
Logout current user session.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/auth/me
Get current authenticated user information.

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "string",
    "name": "string"
  }
}
```

## Workout Endpoints

#### GET /api/workouts
Get all workouts for the authenticated user.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "workouts": [
    {
      "id": 1,
      "title": "string",
      "date": "2025-01-01T10:00:00Z",
      "duration": 3600,
      "notes": "string",
      "exercises": [
        {
          "id": 1,
          "name": "Bench Press",
          "setsData": "[{\"reps\":10,\"weight\":135}]",
          "restSeconds": 90,
          "notes": "string",
          "orderIndex": 0
        }
      ]
    }
  ]
}
```

#### POST /api/workouts
Create a new workout.

**Request Body:**
```json
{
  "title": "string",
  "date": "2025-01-01T10:00:00Z",
  "duration": 3600,
  "notes": "string",
  "exercises": [
    {
      "name": "string",
      "setsData": "[{\"reps\":10,\"weight\":135}]",
      "restSeconds": 90,
      "notes": "string",
      "orderIndex": 0
    }
  ]
}
```

**Response:**
```json
{
  "workout": {
    "id": 1,
    "title": "string",
    "date": "2025-01-01T10:00:00Z",
    "duration": 3600,
    "notes": "string"
  }
}
```

#### GET /api/workouts/[id]
Get a specific workout by ID.

**Response:**
```json
{
  "workout": {
    "id": 1,
    "title": "string",
    "date": "2025-01-01T10:00:00Z",
    "duration": 3600,
    "notes": "string",
    "exercises": [
      {
        "id": 1,
        "name": "string",
        "setsData": "[{\"reps\":10,\"weight\":135}]",
        "restSeconds": 90,
        "notes": "string",
        "orderIndex": 0
      }
    ]
  }
}
```

#### PUT /api/workouts/[id]
Update a specific workout.

**Request Body:**
```json
{
  "title": "string",
  "date": "2025-01-01T10:00:00Z",
  "duration": 3600,
  "notes": "string",
  "exercises": [
    {
      "name": "string",
      "setsData": "[{\"reps\":10,\"weight\":135}]",
      "restSeconds": 90,
      "notes": "string",
      "orderIndex": 0
    }
  ]
}
```

**Response:**
```json
{
  "workout": {
    "id": 1,
    "title": "string",
    "date": "2025-01-01T10:00:00Z",
    "duration": 3600,
    "notes": "string"
  }
}
```

#### DELETE /api/workouts/[id]
Delete a specific workout.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/workouts/calendar
Get workout calendar data for a date range.

**Query Parameters:**
- `startDate`: ISO date string (required)
- `endDate`: ISO date string (required)

**Response:**
```json
{
  "workouts": [
    {
      "id": 1,
      "title": "string",
      "date": "2025-01-01T10:00:00Z",
      "duration": 3600,
      "exerciseCount": 5
    }
  ]
}
```

#### POST /api/workouts/from-template
Create a workout from a session template.

**Request Body:**
```json
{
  "templateId": 1,
  "date": "2025-01-01T10:00:00Z",
  "title": "string"
}
```

**Response:**
```json
{
  "workout": {
    "id": 1,
    "title": "string",
    "date": "2025-01-01T10:00:00Z",
    "templateId": 1
  }
}
```

## Exercise Endpoints

#### GET /api/exercises
Get all unique exercise names.

**Response:**
```json
{
  "exercises": ["Bench Press", "Squat", "Deadlift"]
}
```

#### GET /api/exercises/history/[name]
Get exercise history for a specific exercise name.

**Response:**
```json
{
  "history": [
    {
      "date": "2025-01-01T10:00:00Z",
      "sets": [
        {
          "reps": 10,
          "weight": 135
        }
      ],
      "workoutTitle": "Push Day"
    }
  ]
}
```

## Template Endpoints

#### GET /api/templates
Get all session templates.

**Response:**
```json
{
  "templates": [
    {
      "id": 1,
      "name": "Push Day",
      "description": "Chest, shoulders, triceps",
      "isDefault": false,
      "exerciseCount": 5,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/templates
Create a new session template.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "exercises": [
    {
      "exerciseName": "string",
      "defaultSets": 3,
      "defaultReps": 10,
      "defaultWeight": 135,
      "orderIndex": 0,
      "notes": "string",
      "restSeconds": 90,
      "targetRepRange": "8-12"
    }
  ]
}
```

**Response:**
```json
{
  "template": {
    "id": 1,
    "name": "string",
    "description": "string",
    "isDefault": false
  }
}
```

#### GET /api/templates/[id]
Get a specific template by ID.

**Response:**
```json
{
  "template": {
    "id": 1,
    "name": "string",
    "description": "string",
    "isDefault": false,
    "exercises": [
      {
        "id": 1,
        "exerciseName": "string",
        "defaultSets": 3,
        "defaultReps": 10,
        "defaultWeight": 135,
        "orderIndex": 0,
        "notes": "string",
        "restSeconds": 90,
        "targetRepRange": "8-12"
      }
    ]
  }
}
```

#### PUT /api/templates/[id]
Update a specific template.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "exercises": [
    {
      "exerciseName": "string",
      "defaultSets": 3,
      "defaultReps": 10,
      "defaultWeight": 135,
      "orderIndex": 0,
      "notes": "string",
      "restSeconds": 90,
      "targetRepRange": "8-12"
    }
  ]
}
```

**Response:**
```json
{
  "template": {
    "id": 1,
    "name": "string",
    "description": "string"
  }
}
```

#### DELETE /api/templates/[id]
Delete a specific template.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/templates/[id]/latest-data
Get latest workout data for template exercises.

**Response:**
```json
{
  "latestData": {
    "Bench Press": {
      "weight": 135,
      "reps": 10,
      "date": "2025-01-01T10:00:00Z"
    }
  }
}
```

## Weight Tracking Endpoints

#### GET /api/weight
Get all weight entries for the authenticated user.

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "entries": [
    {
      "id": 1,
      "weight": 180.5,
      "date": "2025-01-01T10:00:00Z",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/weight
Create a new weight entry.

**Request Body:**
```json
{
  "weight": 180.5,
  "date": "2025-01-01T10:00:00Z"
}
```

**Response:**
```json
{
  "entry": {
    "id": 1,
    "weight": 180.5,
    "date": "2025-01-01T10:00:00Z"
  }
}
```

#### PUT /api/weight/[id]
Update a specific weight entry.

**Request Body:**
```json
{
  "weight": 180.5,
  "date": "2025-01-01T10:00:00Z"
}
```

**Response:**
```json
{
  "entry": {
    "id": 1,
    "weight": 180.5,
    "date": "2025-01-01T10:00:00Z"
  }
}
```

#### DELETE /api/weight/[id]
Delete a specific weight entry.

**Response:**
```json
{
  "success": true
}
```

#### GET /api/weight/goal
Get active weight goals for the authenticated user.

**Response:**
```json
{
  "goals": [
    {
      "id": 1,
      "targetWeight": 175,
      "goalType": "weight_loss",
      "targetDate": "2025-06-01T00:00:00Z",
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ]
}
```

#### POST /api/weight/goal
Create a new weight goal.

**Request Body:**
```json
{
  "targetWeight": 175,
  "goalType": "weight_loss",
  "targetDate": "2025-06-01T00:00:00Z"
}
```

**Response:**
```json
{
  "goal": {
    "id": 1,
    "targetWeight": 175,
    "goalType": "weight_loss",
    "targetDate": "2025-06-01T00:00:00Z",
    "isActive": true
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Data Types

### Sets Data Format
The `setsData` field is a JSON string containing an array of set objects:
```json
[
  {
    "reps": 10,
    "weight": 135,
    "completed": true
  },
  {
    "reps": 8,
    "weight": 140,
    "completed": true
  }
]
```

### Goal Types
- `weight_loss`: Target weight is lower than current
- `weight_gain`: Target weight is higher than current
- `maintenance`: Target weight is similar to current

## Rate Limiting

Currently, no rate limiting is implemented. This may be added in future versions.

## Versioning

The API is currently unversioned. Breaking changes will be communicated in advance.