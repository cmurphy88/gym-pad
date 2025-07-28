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
 * @param {Array} sets - Array of set objects
 * @returns {Object} Summary with totalSets, totalReps, maxWeight, totalVolume
 */
export function calculateExerciseSummary(sets) {
  if (!Array.isArray(sets) || sets.length === 0) {
    return {
      totalSets: 0,
      totalReps: 0,
      maxWeight: 0,
      totalVolume: 0
    };
  }

  const totalSets = sets.length;
  const totalReps = sets.reduce((sum, set) => sum + (set.reps || 0), 0);
  const maxWeight = Math.max(...sets.map(set => set.weight || 0));
  const totalVolume = sets.reduce((sum, set) => sum + ((set.weight || 0) * (set.reps || 0)), 0);

  return {
    totalSets,
    totalReps,
    maxWeight,
    totalVolume
  };
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