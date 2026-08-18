import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load the root .env (shared by client + server) first, then any server-local .env.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env = {
  port: Number(process.env.PORT || 5002),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/ems_payroll'),
  jwtSecret: required('JWT_SECRET', 'dev_only_change_me_in_production'),
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: (process.env.NODE_ENV || 'development') === 'production',
  seedAdmin: {
    name: process.env.SEED_ADMIN_NAME || 'HR Admin',
    email: process.env.SEED_ADMIN_EMAIL || 'admin@ems.dev',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
  },
};
