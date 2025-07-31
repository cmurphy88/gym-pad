-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "template_id" INTEGER,
    "title" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "sets_data" TEXT NOT NULL,
    "rest_seconds" INTEGER,
    "notes" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "muscle_groups" TEXT,
    "instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session_templates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_exercises" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "exercise_name" TEXT NOT NULL,
    "default_sets" INTEGER,
    "default_reps" INTEGER,
    "default_weight" DOUBLE PRECISION,
    "order_index" INTEGER NOT NULL,
    "notes" TEXT,
    "rest_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercise_swaps" (
    "id" SERIAL NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "original_exercise_name" TEXT NOT NULL,
    "swapped_exercise_name" TEXT NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workout_exercise_swaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_templates_name_key" ON "exercise_templates"("name");

-- CreateIndex
CREATE UNIQUE INDEX "session_templates_name_key" ON "session_templates"("name");

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_exercises" ADD CONSTRAINT "template_exercises_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "session_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercise_swaps" ADD CONSTRAINT "workout_exercise_swaps_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;