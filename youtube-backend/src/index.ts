import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { init } from './db.js';
import channelsRouter from './routes/channels.js';
import authRouter from './routes/auth.js';
import adminCompaniesRouter from './routes/adminCompanies.js';
import adminSettingsRouter from './routes/adminSettings.js';
import adminMetricsRouter from './routes/adminMetrics.js';
import paymentsRouter from './routes/payments.js';
import adminAuthRouter from './routes/adminAuth.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/channels', channelsRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin/companies', adminCompaniesRouter);
app.use('/api/admin/settings', adminSettingsRouter);
app.use('/api/admin/metrics', adminMetricsRouter);
app.use('/api/payments', paymentsRouter);

const PORT = process.env.PORT || 5179;

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database', err);
});
