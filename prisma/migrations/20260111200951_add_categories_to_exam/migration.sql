/*
  Warnings:

  - Added the required column `categories` to the `Exam` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Exam" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "course_id" TEXT,
    "categories" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "start_window" DATETIME NOT NULL,
    "end_window" DATETIME NOT NULL,
    "total_questions" INTEGER NOT NULL,
    "rules" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exam_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "Course" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Exam_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Exam" ("course_id", "created_at", "created_by", "duration_minutes", "end_window", "id", "rules", "start_window", "title", "total_questions") SELECT "course_id", "created_at", "created_by", "duration_minutes", "end_window", "id", "rules", "start_window", "title", "total_questions" FROM "Exam";
DROP TABLE "Exam";
ALTER TABLE "new_Exam" RENAME TO "Exam";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
