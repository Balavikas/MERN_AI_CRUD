-- Reshape public.registrations to match the SkillStack sign-up form.
-- Existing rows are removed on purpose (see specs/RegistrationFeature.md).

TRUNCATE TABLE registrations RESTART IDENTITY;

ALTER TABLE registrations RENAME COLUMN name TO full_name;
ALTER TABLE registrations RENAME COLUMN phone TO phone_number;
ALTER TABLE registrations RENAME CONSTRAINT registrations_phone_key TO registrations_phone_number_key;
ALTER TABLE registrations DROP COLUMN course;
ALTER TABLE registrations ADD COLUMN password_hash TEXT NOT NULL;
ALTER TABLE registrations ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
