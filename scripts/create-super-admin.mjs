import nextEnv from '@next/env';
const { loadEnvConfig } = nextEnv;
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

loadEnvConfig(process.cwd());

const rl = readline.createInterface({ input: stdin, output: stdout });

async function main() {
  const name = (await rl.question('Super Admin name: ')).trim();
  const email = (await rl.question('Super Admin email: ')).trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid name and email.');
  }

  if (!password || password.length < 12) {
    throw new Error('Password must be at least 12 characters.');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is missing from .env.local');

  await mongoose.connect(uri);

  const users = mongoose.connection.collection('users');

  const existingAdmin = await users.findOne({ role: 'SUPER_ADMIN' });

  if (existingAdmin) {
    throw new Error('A Super Admin already exists. Setup is locked.');
  }

  const existingUser = await users.findOne({ email });

  if (existingUser) {
    throw new Error('This email already belongs to an account. Use another email.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date();

  await users.insertOne({
    name,
    email,
    passwordHash,
    role: 'SUPER_ADMIN',
    isVerified: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log('Super Admin account created successfully.');
  console.log(`Login email: ${email}`);
}

main()
  .catch((error) => {
    console.error('Setup failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  });
