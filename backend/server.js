const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/report');
require('dotenv').config();

const app = express(); 
app.use(cors());
app.use(bodyParser.json({limit: '1mb'}));

const PORT = process.env.PORT || 5000;
const MONGO = process.env.MONGODB_URI || 'mongodb://localhost:27017/prd_readiness';

mongoose.connect(MONGO, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=> console.log('MongoDB connected'))
  .catch(err=>console.error('MongoDB connection error', err));

app.use('/api/auth', authRoutes);
app.use('/api/report', reportRoutes);

app.get('/', (req, res) => res.send('PRD Readiness Analyzer Backend'));

app.listen(PORT, ()=> console.log('Server running on port', PORT));
