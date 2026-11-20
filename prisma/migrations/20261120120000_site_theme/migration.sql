CREATE TABLE "SiteSettings" (
 "id" TEXT NOT NULL DEFAULT 'site',
 "theme" TEXT NOT NULL DEFAULT 'light',
 "updatedAt" TIMESTAMPTZ(3) NOT NULL,
 CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
