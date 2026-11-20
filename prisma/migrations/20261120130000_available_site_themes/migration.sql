ALTER TABLE "SiteSettings" ADD COLUMN "themes" TEXT[] NOT NULL DEFAULT ARRAY['TechLight', 'TechDark', 'night', 'lemonade']::TEXT[];
