-- Existing databases may still require a bio from the original table definition.
ALTER TABLE "Profile" ALTER COLUMN "description" DROP NOT NULL;
