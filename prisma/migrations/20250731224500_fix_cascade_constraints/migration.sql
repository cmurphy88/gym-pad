-- Fix workouts foreign key to use CASCADE DELETE for testing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workouts_user_id_fkey'
    ) THEN
        ALTER TABLE "workouts" DROP CONSTRAINT "workouts_user_id_fkey";
    END IF;
    
    ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" 
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
END $$;