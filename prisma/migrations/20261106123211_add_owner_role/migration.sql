-- Commit the enum extension before using OWNER in the following migration.
ALTER TYPE public."UserRole" ADD VALUE 'OWNER';
