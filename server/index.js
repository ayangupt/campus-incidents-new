require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { getDb, seedDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

async function start() {
  await getDb();
  await seedDb();

  const incidentRoutes = require('./routes/incidents');
  const adminRoutes = require('./routes/admin');

  app.use('/api/incidents', incidentRoutes);
  app.use('/api/admin', adminRoutes);

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();
