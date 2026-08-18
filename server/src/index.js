import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function bootstrap() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`🚀 EMS & Payroll API running on http://localhost:${env.port}/api`);
      console.log(`   Health: http://localhost:${env.port}/api/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

bootstrap();
