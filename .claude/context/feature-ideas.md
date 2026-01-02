# Gym Pad Feature Ideas

This document captures planned features for future implementation.

---

## 1. PR (Personal Record) Tracking ✅ IMPLEMENTING FIRST

See `pr-tracking-plan.md` for implementation details.

---

## 2. Progressive Overload Suggestions ✅ COMPLETE

**Implemented:**
- `lib/progression-suggestions.js` - Core suggestion utilities
- `components/ProgressionBadge.jsx` - Status badge component
- `components/InsightsDashboard.jsx` - Insights page content
- `app/insights/page.js` - Dedicated insights page
- `app/api/insights/route.js` - API for aggregated insights
- Modified `SessionForm.jsx` - Progression badges in template prefill
- Modified `Header.jsx` - Navigation link to insights page

### Overview
Analyze recent workout history and RPE trends to suggest when to increase weight.

### Logic Rules

**Rule 1: Consistent Low RPE**
```
IF last 3 sessions of [exercise]:
   - Same weight
   - Hit target reps
   - Average RPE ≤ 7
THEN suggest: "Increase weight by 5 lbs"
```

**Rule 2: RPE Trending Down**
```
IF RPE trend for [exercise]:
   Session 1: RPE 9
   Session 2: RPE 8
   Session 3: RPE 7
THEN suggest: "You're adapting well - ready for +5 lbs"
```

**Rule 3: Hitting Top of Rep Range**
```
IF template target is 8-12 reps
   AND consistently hitting 12 reps
   AND RPE < 9
THEN suggest: "Increase weight, aim for 8 reps"
```

**Rule 4: Stalled Progress**
```
IF same weight for 4+ sessions
   AND RPE consistently 9-10
   AND not hitting target reps
THEN suggest: "Consider a deload or try micro-plates"
```

### When to Show Suggestions

**Option A: On workout start (template prefill)**
- Show suggestions when starting a workout from a template
- Display next to each exercise with reasoning

**Option B: Dedicated insights page**
- Separate page showing all exercises
- Categorized: "Ready to Progress", "Maintain", "Consider Adjusting"

### Data Requirements
- Exercise history with weights/reps ✅ (already have)
- RPE per set in setsData ✅ (already have)
- Template target rep ranges ✅ (already have)

### UI Mockup
```
┌─────────────────────────────────────────┐
│ Starting: Push Day                      │
├─────────────────────────────────────────┤
│ 💡 Suggestions based on recent sessions │
│                                         │
│ Bench Press                             │
│   Last: 185 × 8 @ RPE 7 (3 sessions)   │
│   → Try 190 lbs today                   │
│                                         │
│ OHP                                     │
│   Last: 95 × 10 @ RPE 8                │
│   → Stay at 95 lbs, aim for 12 reps    │
└─────────────────────────────────────────┘
```

---

## 3. Volume Analytics ✅ COMPLETE

**Implemented:**
- `lib/volume-analytics.js` - Volume calculation utilities
- `components/VolumeCharts.jsx` - Volume visualizations (weekly trend, muscle breakdown, balance)
- Modified `components/TemplateEditor.jsx` - Muscle groups selector for exercises
- Modified template API routes - Save muscleGroups field
- Modified `app/api/insights/route.js` - Volume data in insights response
- Modified `components/InsightsDashboard.jsx` - Integrated VolumeCharts

### Overview
Track and visualize training volume per muscle group over time.

### Volume Calculations
```
Set Volume    = weight × reps
Exercise Vol  = sum of all sets
Workout Vol   = sum of all exercises
Weekly Vol    = sum of all workouts in week
```

### Muscle Group Mapping

Option 1: Use existing `muscleGroups` field in ExerciseTemplate table

Option 2: Create mapping in code:
```javascript
const muscleGroupMap = {
  'Bench Press': ['Chest', 'Triceps', 'Shoulders'],
  'Squat': ['Quads', 'Glutes', 'Core'],
  'Deadlift': ['Back', 'Hamstrings', 'Glutes'],
  'OHP': ['Shoulders', 'Triceps'],
  // Primary muscle for simpler tracking
};

const primaryMuscle = {
  'Bench Press': 'Chest',
  'Squat': 'Quads',
  'Deadlift': 'Back',
  // ...
};
```

### Visualizations

**Weekly Volume Trend Chart**
- Line or bar chart showing total volume per week
- Filterable by muscle group

**Volume by Muscle Group**
- Horizontal bar chart showing weekly volume per muscle
- Color-coded by muscle group category

**Balance Indicators**
- Push/Pull ratio
- Upper/Lower ratio
- Visual warnings when imbalanced

**Week-over-Week Comparison**
- Table showing this week vs last week
- Percentage change indicators

### UI Mockups

```
┌─────────────────────────────────────────┐
│ This Week's Volume by Muscle            │
├─────────────────────────────────────────┤
│ Chest     ████████████████░░░░  12,450  │
│ Back      ██████████████░░░░░░  10,200  │
│ Quads     ████████████░░░░░░░░   8,800  │
│ Shoulders ████████░░░░░░░░░░░░   5,600  │
│ Hamstrings███████░░░░░░░░░░░░░   4,200  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Push/Pull Balance                       │
│ Push: 52% ████████████░░░░░░░░         │
│ Pull: 48% ███████████░░░░░░░░░         │
│ ✅ Well balanced                        │
└─────────────────────────────────────────┘
```

### Data Requirements
- All exercise data ✅ (already have)
- Muscle group mapping (need to create or expand ExerciseTemplate)

---

## 4. Other Feature Ideas (Lower Priority)

### Rest Timer
- Built-in timer between sets
- Audio/vibration alerts
- Auto-start when logging a set
- Customizable defaults per exercise type

### Workout Streaks & Consistency
- Training streak counter
- Weekly/monthly consistency percentage
- GitHub-style contribution heatmap

### Copy Previous Workout
- One-tap to duplicate a recent workout
- "Repeat last Push Day" functionality

### Exercise Notes History
- Show notes from last 3-5 sessions when viewing an exercise
- "Last time: felt strong, try 140 next time"

### Data Export
- CSV/JSON export of all workout history
- Useful for backup or external analysis

### Superset Support
- Group 2-3 exercises as a superset/circuit
- Shared rest timer between the group

### Goal Setting
- Set specific goals ("Bench 225 for 5 reps by March")
- Track progress toward goals with projections

### PWA/Offline Support
- Install to home screen
- Log workouts offline, sync when connected

### Warm-up vs Working Sets
- Distinguish warm-up sets (don't count toward volume/PRs)
- Auto-generate warm-up pyramid based on working weight

---

## Implementation Order (Recommended)

1. **PR Tracking** ✅ - High value, uses existing data
2. **Progressive Overload Suggestions** ✅ - Complements PR tracking
3. **Volume Analytics** ✅ - Builds on exercise data
4. **Rest Timer** - Practical during workouts
5. **Other features** - As needed

---

## Notes

- All features should work with existing data model where possible
- Prioritize derived/calculated data over new tables for simplicity
- Mobile-first UI considerations for during-workout features
