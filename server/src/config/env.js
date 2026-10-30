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
    name: process.env.SEED_ADMIN_NAME || 'Mohd Zaid (Admin)',
    email: process.env.SEED_ADMIN_EMAIL || 'zaidm1323@gmail.com',
    password: process.env.SEED_ADMIN_PASSWORD || 'Zaid@9999201255',
  },
  // Email / SMTP
  smtp: {
    server: process.env.SMTP_SERVER || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  },
  brevoApiKey: process.env.BREVO_API_KEY || '',
  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};
