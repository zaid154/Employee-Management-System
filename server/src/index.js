import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { User } from './models/User.js';

async function bootstrap() {
  try {
    await connectDB();

    // Ensure all existing legacy & demo accounts have isVerified: true and status: 'ACTIVE' so they can sign in seamlessly
    await User.updateMany(
      { $or: [{ isVerified: { $exists: false } }, { status: { $exists: false } }, { status: null }] },
      { $set: { isVerified: true, status: 'ACTIVE' } }
    );

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`[READY] EMS & Payroll API running on http://localhost:${env.port}/api`);
      console.log(`        Health check: http://localhost:${env.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
