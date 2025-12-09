-- Add displayname and password_hash columns to users table
ALTER TABLE users ADD COLUMN displayname TEXT;
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Set displayname to username for existing users
UPDATE users SET displayname = username WHERE displayname IS NULL;

