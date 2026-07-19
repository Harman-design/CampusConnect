/**
 * Usage: npm run seed:admin -- --name "Admin Name" --email admin@srmist.edu.in --password Admin@12345
 * Creates (or upgrades) a user with role "admin". Run this once after setting up MongoDB Atlas.
 */
require('dotenv').config();
require('../config/dnsPatch');
const mongoose = require('mongoose');
const User = require('../models/User');

function parseArgs() {
  const args = process.argv.slice(2);
  const result = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      result[key] = args[i + 1];
      i += 1;
    }
  }
  return result;
}

async function run() {
  const { name, email, password } = parseArgs();

  if (!name || !email || !password) {
    console.error('Usage: npm run seed:admin -- --name "Admin Name" --email admin@example.com --password Secret123');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('[Seed] Connected to MongoDB Atlas.');

  let user = await User.findOne({ email });
  if (user) {
    user.role = 'admin';
    user.isActive = true;
    await user.save({ validateBeforeSave: false });
    console.log(`[Seed] Existing user upgraded to admin: ${email}`);
  } else {
    user = await User.create({ name, email, password, role: 'admin' });
    console.log(`[Seed] Admin user created: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[Seed] Error:', err);
  process.exit(1);
});
