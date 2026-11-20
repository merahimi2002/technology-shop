ALTER TABLE "SiteSettings" ALTER COLUMN "themes" SET DEFAULT ARRAY['night','lemonade','halloween','bumblebee']::TEXT[];
UPDATE "SiteSettings" SET "themes" = ARRAY(
 SELECT name FROM unnest("themes" || ARRAY['night','lemonade','halloween','bumblebee']::TEXT[]) WITH ORDINALITY AS options(name, position)
 WHERE name NOT IN ('TechLight','TechDark') GROUP BY name ORDER BY min(position) LIMIT 4
);
