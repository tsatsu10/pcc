const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRaw`SELECT 1 as ok, current_database() as db`
  .then((r) => {
    console.log('Database OK:', JSON.stringify(r, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error('Database Error:', e.message);
    process.exit(1);
  });
