-- CreateEnum for AssignmentSubmissionStatus (if not exists)
DO $$ BEGIN
  CREATE TYPE "AssignmentSubmissionStatus" AS ENUM ('NOT_SUBMITTED', 'SUBMITTED', 'GRADED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- QuizSubmissionStatus already exists, no need to create

-- Rename submissions table to assignment_submissions (if not already renamed)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'submissions') THEN
    ALTER TABLE "submissions" RENAME TO "assignment_submissions";
  END IF;
END $$;

-- Drop the default value first (if column exists)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'assignment_submissions' AND column_name = 'status') THEN
    ALTER TABLE "assignment_submissions" ALTER COLUMN "status" DROP DEFAULT;
  END IF;
END $$;

-- Update status column type from SubmissionStatus to AssignmentSubmissionStatus
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'assignment_submissions' AND column_name = 'status') THEN
    ALTER TABLE "assignment_submissions" 
      ALTER COLUMN "status" TYPE "AssignmentSubmissionStatus" 
      USING (
        CASE 
          WHEN "status"::text = 'NOT_SUBMITTED' THEN 'NOT_SUBMITTED'::"AssignmentSubmissionStatus"
          WHEN "status"::text = 'SUBMITTED' THEN 'SUBMITTED'::"AssignmentSubmissionStatus"
          WHEN "status"::text = 'GRADED' THEN 'GRADED'::"AssignmentSubmissionStatus"
          ELSE 'NOT_SUBMITTED'::"AssignmentSubmissionStatus"
        END
      );
  END IF;
END $$;

-- Set the new default value
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'assignment_submissions' AND column_name = 'status') THEN
    ALTER TABLE "assignment_submissions" 
      ALTER COLUMN "status" SET DEFAULT 'NOT_SUBMITTED'::"AssignmentSubmissionStatus";
  END IF;
END $$;

-- CreateTable for quiz_submissions (if not exists)
CREATE TABLE IF NOT EXISTS "quiz_submissions" (
    "id" UUID NOT NULL,
    "quizId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "answers" JSONB NOT NULL,
    "grade" DOUBLE PRECISION,
    "feedback" TEXT,
    "status" "QuizSubmissionStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "version" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignment_submissions_studentId_idx') THEN
    CREATE INDEX "assignment_submissions_studentId_idx" ON "assignment_submissions"("studentId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignment_submissions_assignmentId_idx') THEN
    CREATE INDEX "assignment_submissions_assignmentId_idx" ON "assignment_submissions"("assignmentId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignment_submissions_status_idx') THEN
    CREATE INDEX "assignment_submissions_status_idx" ON "assignment_submissions"("status");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignment_submissions_studentId_status_idx') THEN
    CREATE INDEX "assignment_submissions_studentId_status_idx" ON "assignment_submissions"("studentId", "status");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'assignment_submissions_assignmentId_studentId_idx') THEN
    CREATE INDEX "assignment_submissions_assignmentId_studentId_idx" ON "assignment_submissions"("assignmentId", "studentId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_submissions_quizId_studentId_key') THEN
    CREATE UNIQUE INDEX "quiz_submissions_quizId_studentId_key" ON "quiz_submissions"("quizId", "studentId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_submissions_studentId_idx') THEN
    CREATE INDEX "quiz_submissions_studentId_idx" ON "quiz_submissions"("studentId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_submissions_quizId_idx') THEN
    CREATE INDEX "quiz_submissions_quizId_idx" ON "quiz_submissions"("quizId");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_submissions_status_idx') THEN
    CREATE INDEX "quiz_submissions_status_idx" ON "quiz_submissions"("status");
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'quiz_submissions_studentId_status_idx') THEN
    CREATE INDEX "quiz_submissions_studentId_status_idx" ON "quiz_submissions"("studentId", "status");
  END IF;
END $$;

-- AddForeignKey (if not exists)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_submissions_studentId_fkey') THEN
    ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_studentId_fkey" 
      FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quiz_submissions_quizId_fkey') THEN
    ALTER TABLE "quiz_submissions" ADD CONSTRAINT "quiz_submissions_quizId_fkey" 
      FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Drop old SubmissionStatus enum (if no longer used)
-- Note: This will be done after verifying no other tables use it
-- DROP TYPE IF EXISTS "SubmissionStatus";
