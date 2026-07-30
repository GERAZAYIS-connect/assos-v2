const { createClient } = require('@libsql/client');
require('dotenv').config();

async function main() {
  const url = process.env.DATABASE_URL; // Should be libsql://
  const authToken = process.env.Auth_Token;

  if (!url || !authToken) {
    console.error('DATABASE_URL or Auth_Token is missing');
    return;
  }

  const client = createClient({
    url,
    authToken,
  });

  try {
    const sql = `
CREATE TABLE "contact_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
    `;
    await client.execute(sql);
    console.log('Successfully created contact_messages table in Turso.');
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

main();
