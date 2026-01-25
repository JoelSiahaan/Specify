-- Add completedAt column to quiz_submissions table
-- This column tracks when a quiz was completed (before submission for grading)

ALTER TABLE "quiz_submissions" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
