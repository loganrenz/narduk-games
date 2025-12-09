/**
 * Migration script to migrate users from lexi-stack database to unified auth database
 * 
 * Usage:
 * 1. Make sure both databases exist and are accessible
 * 2. Run: node migrate-lexi-stack-users.js
 * 
 * This script:
 * - Reads all users from the old lexi-stack database
 * - Writes them to the new narduk-games-auth database
 * - Handles conflicts (usernames already in auth DB)
 * - Preserves all user data (id, username, displayname, password_hash)
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database names
const OLD_DB_NAME = 'lexistack';
const NEW_DB_NAME = 'narduk-games-auth';

console.log('Starting user migration...');
console.log(`Source: ${OLD_DB_NAME}`);
console.log(`Destination: ${NEW_DB_NAME}\n`);

try {
  // Step 1: Get all users from old database
  console.log('Step 1: Fetching users from old database...');
  const oldUsersResult = execSync(
    `wrangler d1 execute ${OLD_DB_NAME} --command "SELECT id, username, displayname, password_hash, created_at FROM users" --json`,
    { encoding: 'utf-8' }
  );
  
  const oldUsersData = JSON.parse(oldUsersResult);
  const oldUsers = oldUsersData[0]?.results || [];
  
  console.log(`Found ${oldUsers.length} users to migrate\n`);

  if (oldUsers.length === 0) {
    console.log('No users to migrate. Exiting.');
    process.exit(0);
  }

  // Step 2: Check existing users in new database
  console.log('Step 2: Checking existing users in new database...');
  let existingUsers = [];
  try {
    const existingResult = execSync(
      `wrangler d1 execute ${NEW_DB_NAME} --command "SELECT id, username FROM users" --json`,
      { encoding: 'utf-8' }
    );
    const existingData = JSON.parse(existingResult);
    existingUsers = existingData[0]?.results || [];
    console.log(`Found ${existingUsers.length} existing users in new database\n`);
  } catch (error) {
    console.log('New database appears empty or doesn\'t exist yet\n');
  }

  const existingUserIds = new Set(existingUsers.map(u => u.id));
  const existingUsernames = new Set(existingUsers.map(u => u.username));

  // Step 3: Migrate users
  console.log('Step 3: Migrating users...');
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of oldUsers) {
    try {
      // Skip if user already exists (by ID)
      if (existingUserIds.has(user.id)) {
        console.log(`  ⏭️  Skipping user ${user.username} (ID already exists)`);
        skipped++;
        continue;
      }

      // Check if username is taken by a different user
      if (existingUsernames.has(user.username) && !existingUserIds.has(user.id)) {
        console.log(`  ⚠️  Username ${user.username} is taken by different user. Skipping.`);
        skipped++;
        continue;
      }

      // Insert user into new database
      const displayname = user.displayname || user.username;
      const passwordHash = user.password_hash || null;
      const createdAt = user.created_at || Math.floor(Date.now() / 1000);

      const insertCommand = `
        INSERT INTO users (id, username, displayname, password_hash, created_at, updated_at)
        VALUES ('${user.id}', '${user.username.replace(/'/g, "''")}', '${displayname.replace(/'/g, "''")}', ${passwordHash ? `'${passwordHash.replace(/'/g, "''")}'` : 'NULL'}, ${createdAt}, ${createdAt})
      `;

      execSync(
        `wrangler d1 execute ${NEW_DB_NAME} --command "${insertCommand}"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );

      console.log(`  ✅ Migrated user: ${user.username} (${user.id})`);
      migrated++;
    } catch (error) {
      console.error(`  ❌ Error migrating user ${user.username}:`, error.message);
      errors++;
    }
  }

  // Step 4: Summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total users in source: ${oldUsers.length}`);
  console.log(`Successfully migrated: ${migrated}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log('========================\n');

  if (errors > 0) {
    console.log('⚠️  Some users failed to migrate. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('✅ Migration completed successfully!');
  }
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

