-- Add authentication fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" TEXT;

-- Make username unique if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'username') THEN
        -- Drop email constraint and add username constraint
        ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_email_key";
        CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username");
    END IF;
END $$;

-- Create sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Add indexes and constraints for sessions
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_token_key" ON "sessions"("token");

-- Add foreign key for sessions if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'sessions_user_id_fkey'
    ) THEN
        ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create weight_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS "weight_entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_entries_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for weight_entries if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'weight_entries_user_id_fkey'
    ) THEN
        ALTER TABLE "weight_entries" ADD CONSTRAINT "weight_entries_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create weight_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS "weight_goals" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "target_weight" DOUBLE PRECISION NOT NULL,
    "goal_type" TEXT NOT NULL,
    "target_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weight_goals_pkey" PRIMARY KEY ("id")
);

-- Add foreign key for weight_goals if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'weight_goals_user_id_fkey'
    ) THEN
        ALTER TABLE "weight_goals" ADD CONSTRAINT "weight_goals_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Add target_rep_range column to template_exercises if it doesn't exist
ALTER TABLE "template_exercises" ADD COLUMN IF NOT EXISTS "target_rep_range" TEXT;

-- Update workouts foreign key to be NOT NULL and CASCADE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workouts_user_id_fkey'
    ) THEN
        ALTER TABLE "workouts" DROP CONSTRAINT "workouts_user_id_fkey";
    END IF;
    
    -- Make user_id NOT NULL if it's currently nullable
    ALTER TABLE "workouts" ALTER COLUMN "user_id" SET NOT NULL;
    
    ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
END $$;