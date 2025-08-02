import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Migration script to convert existing exercise data from old format to new sets array format
 * Old format: { sets: Int, reps: Int, weight: Float }
 * New format: { setsData: String } where setsData is JSON array like [{ weight: Float, reps: Int }]
 */
async function migrateExerciseSets() {
  try {
    console.log('🔄 Starting exercise sets migration...');
    
    // First, check if we need to add the setsData column (in case migration hasn't run yet)
    console.log('📊 Checking current database structure...');
    
    // Get all exercises in the old format (this will work before schema migration)
    let exercises;
    try {
      // Try to get exercises with old format
      exercises = await prisma.$queryRaw`
        SELECT id, sets, reps, weight, workout_id, name, rest_seconds, notes, order_index, created_at 
        FROM exercises
      `;
    } catch (error) {
      console.log('⚠️  Could not read exercises with old format. This might mean migration already ran or schema was updated.');
      console.log('Error:', error.message);
      return;
    }

    if (!exercises || exercises.length === 0) {
      console.log('✅ No exercises found to migrate.');
      return;
    }

    console.log(`📋 Found ${exercises.length} exercises to migrate...`);
    console.log('🔄 Converting exercise data format...');

    let migrated = 0;
    let errors = 0;

    for (const exercise of exercises) {
      try {
        // Convert old format to new sets array format
        // Create array with 'sets' number of identical set objects
        const setsArray = [];
        const numSets = exercise.sets || 1;
        const reps = exercise.reps || 0;
        const weight = exercise.weight || 0;

        for (let i = 0; i < numSets; i++) {
          setsArray.push({
            weight: weight,
            reps: reps
          });
        }

        const setsDataJson = JSON.stringify(setsArray);

        // Update the exercise with new format using raw SQL
        // This approach works regardless of whether schema migration has completed
        await prisma.$executeRaw`
          UPDATE exercises 
          SET sets_data = ${setsDataJson}
          WHERE id = ${exercise.id}
        `;

        migrated++;
        
        if (migrated % 10 === 0) {
          console.log(`✅ Migrated ${migrated}/${exercises.length} exercises...`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrating exercise ${exercise.id} (${exercise.name}):`, error.message);
        errors++;
      }
    }

    console.log(`\n🎉 Migration completed!`);
    console.log(`✅ Successfully migrated: ${migrated} exercises`);
    console.log(`❌ Errors: ${errors} exercises`);
    
    if (errors === 0) {
      console.log('\n📝 Next steps:');
      console.log('1. Run: npx prisma migrate dev --name convert-sets-to-array');
      console.log('2. Run: npx prisma generate');
      console.log('3. Test the API endpoints with new format');
    }

  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Utility function to convert old exercise format to new format
 * @param {Object} oldExercise - Exercise in old format
 * @returns {Object} Exercise in new format
 */
export function convertExerciseFormat(oldExercise) {
  if (!oldExercise) return null;
  
  // If already in new format, return as-is
  if (oldExercise.setsData || oldExercise.sets === undefined) {
    return oldExercise;
  }
  
  // Convert old format to new
  const setsArray = [];
  const numSets = oldExercise.sets || 1;
  const reps = oldExercise.reps || 0;
  const weight = oldExercise.weight || 0;

  for (let i = 0; i < numSets; i++) {
    setsArray.push({
      weight: weight,
      reps: reps
    });
  }

  return {
    ...oldExercise,
    setsData: JSON.stringify(setsArray),
    // Remove old fields
    sets: undefined,
    reps: undefined,
    weight: undefined
  };
}

/**
 * Utility function to parse sets data from JSON string
 * @param {string} setsDataJson - JSON string of sets array
 * @returns {Array} Parsed sets array
 */
export function parseSetsData(setsDataJson) {
  if (!setsDataJson) return [];
  
  try {
    const sets = JSON.parse(setsDataJson);
    return Array.isArray(sets) ? sets : [];
  } catch (error) {
    console.error('Error parsing sets data:', error);
    return [];
  }
}

/**
 * Utility function to calculate exercise summary from sets array
 * @param {Array} sets - Array of set objects with optional RPE
 * @returns {Object} Summary with totalSets, totalReps, maxWeight, totalVolume, averageRPE
 */
export function calculateExerciseSummary(sets) {
  if (!Array.isArray(sets) || sets.length === 0) {
    return {
      totalSets: 0,
      totalReps: 0,
      maxWeight: 0,
      totalVolume: 0,
      averageRPE: null,
      maxRPE: null
    };
  }

  const totalSets = sets.length;
  const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
  const maxWeight = Math.max(...sets.map(set => set.weight || 0));
  const totalVolume = sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);
  
  // Calculate RPE metrics
  const setsWithRPE = sets.filter(set => set.rpe && set.rpe > 0);
  const averageRPE = setsWithRPE.length > 0 
    ? setsWithRPE.reduce((sum, set) => sum + set.rpe, 0) / setsWithRPE.length 
    : null;
  const maxRPE = setsWithRPE.length > 0 
    ? Math.max(...setsWithRPE.map(set => set.rpe)) 
    : null;

  return {
    totalSets,
    totalReps,
    maxWeight,
    totalVolume,
    averageRPE: averageRPE ? Number(averageRPE.toFixed(1)) : null,
    maxRPE
  };
}

/**
 * Analyze RPE data for auto-regulation insights
 * @param {Array} exerciseHistory - Array of exercise sessions with sets data
 * @param {string} targetRepRange - Target rep range (e.g., "8-12")
 * @returns {Object} RPE analysis and recommendations
 */
export function analyzeRPEData(exerciseHistory, targetRepRange) {
  if (!Array.isArray(exerciseHistory) || exerciseHistory.length === 0) {
    return {
      hasRPEData: false,
      recommendation: null,
      analysis: null
    };
  }

  // Get the most recent session with RPE data
  const recentSessionsWithRPE = exerciseHistory
    .filter(session => session.sets && session.sets.some(set => set.rpe))
    .slice(0, 3); // Last 3 sessions

  if (recentSessionsWithRPE.length === 0) {
    return {
      hasRPEData: false,
      recommendation: null,
      analysis: null
    };
  }

  const lastSession = recentSessionsWithRPE[0];
  const lastSessionSummary = calculateExerciseSummary(lastSession.sets);
  
  // Parse target rep range
  const repRange = parseRepRange(targetRepRange);
  
  // Generate recommendations based on last session RPE
  const recommendation = generateProgressionRecommendation(
    lastSession.sets,
    lastSessionSummary,
    repRange
  );

  // Calculate RPE trends
  const rpeHistory = recentSessionsWithRPE.map(session => 
    calculateExerciseSummary(session.sets).averageRPE
  ).filter(Boolean);

  const rpeTrend = rpeHistory.length > 1 
    ? rpeHistory[0] - rpeHistory[1] 
    : 0;

  return {
    hasRPEData: true,
    lastSessionRPE: lastSessionSummary.averageRPE,
    maxRPE: lastSessionSummary.maxRPE,
    rpeTrend,
    recommendation,
    analysis: {
      fatigue: lastSessionSummary.averageRPE >= 8.5 ? 'high' : 
               lastSessionSummary.averageRPE >= 7 ? 'moderate' : 'low',
      readiness: lastSessionSummary.averageRPE <= 7 ? 'good' : 
                 lastSessionSummary.averageRPE <= 8.5 ? 'moderate' : 'poor'
    }
  };
}

/**
 * Parse rep range string into min/max values
 * @param {string} repRange - Rep range string (e.g., "8-12", "5", "8-10")
 * @returns {Object} {min, max} rep values
 */
function parseRepRange(repRange) {
  if (!repRange) return { min: 1, max: 15 };
  
  if (repRange.includes('-')) {
    const [min, max] = repRange.split('-').map(n => parseInt(n.trim()));
    return { min: min || 1, max: max || 15 };
  } else {
    const target = parseInt(repRange.trim());
    return { min: target - 1, max: target + 1 };
  }
}

/**
 * Generate progression recommendations based on RPE and performance
 * @param {Array} lastSets - Sets from last session
 * @param {Object} summary - Exercise summary with RPE data
 * @param {Object} repRange - Target rep range {min, max}
 * @returns {Object} Progression recommendation
 */
function generateProgressionRecommendation(lastSets, summary, repRange) {
  if (!summary.averageRPE) {
    return {
      type: 'maintain',
      message: 'Continue with current weights - no RPE data available',
      weightChange: 0,
      repChange: 0
    };
  }

  const avgRPE = summary.averageRPE;
  const lastSet = lastSets[lastSets.length - 1]; // Final working set
  const currentReps = lastSet?.reps || 0;
  const currentWeight = lastSet?.weight || 0;

  // Progressive overload logic based on RPE
  if (avgRPE <= 6.5) {
    // Too easy - significant increase
    if (currentReps >= repRange.max) {
      return {
        type: 'increase_weight',
        message: 'RPE too low - increase weight and reset reps',
        weightChange: 5,
        repChange: -(currentReps - repRange.min),
        targetRPE: '7-8'
      };
    } else {
      return {
        type: 'increase_reps',
        message: 'RPE too low - add more reps',
        weightChange: 0,
        repChange: 2,
        targetRPE: '7-8'
      };
    }
  } else if (avgRPE <= 7.5) {
    // Good progression zone
    if (currentReps >= repRange.max) {
      return {
        type: 'increase_weight',
        message: 'Perfect RPE - increase weight and reset reps',
        weightChange: 2.5,
        repChange: -(currentReps - repRange.min),
        targetRPE: '7-8'
      };
    } else {
      return {
        type: 'increase_reps',
        message: 'Perfect RPE - add one more rep',
        weightChange: 0,
        repChange: 1,
        targetRPE: '7-8'
      };
    }
  } else if (avgRPE <= 8.5) {
    // Challenging but manageable
    return {
      type: 'maintain',
      message: 'Good intensity - maintain weight and reps',
      weightChange: 0,
      repChange: 0,
      targetRPE: '7-8'
    };
  } else {
    // Too intense - deload
    return {
      type: 'decrease_weight',
      message: 'RPE too high - reduce weight to improve form',
      weightChange: -5,
      repChange: 0,
      targetRPE: '7-8'
    };
  }
}

// Run migration if called directly
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  migrateExerciseSets()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}