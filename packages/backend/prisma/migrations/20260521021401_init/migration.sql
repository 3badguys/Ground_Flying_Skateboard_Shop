-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "enrollmentDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_infos" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "hours" INTEGER NOT NULL,
    "tuition" DOUBLE PRECISION NOT NULL,
    "enrollmentDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_infos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "class_records" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "classDate" DATE NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "hours" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_infos_studentId_idx" ON "course_infos"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");

-- CreateIndex
CREATE INDEX "class_records_studentId_idx" ON "class_records"("studentId");

-- AddForeignKey
ALTER TABLE "course_infos" ADD CONSTRAINT "course_infos_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_records" ADD CONSTRAINT "class_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
