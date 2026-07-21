const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const noteRoutes = require('./routes/noteRoutes');
const pyqRoutes = require('./routes/pyqRoutes');
const placementRoutes = require('./routes/placementRoutes');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const complaintRoutes = require('./routes/complaintRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const aiRoutes = require('./routes/aiRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const adminRoutes = require('./routes/adminRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const { globalErrorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'https://campus-connect-nine-eta.vercel.app',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000',
      ].filter(Boolean);
      if (allowedOrigins.includes(origin) || /^https:\/\/.*\.vercel\.app$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CampusConnect Backend API is running.',
    healthCheck: '/api/health',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CampusConnect API is healthy.', timestamp: new Date().toISOString() });
});

app.get('/api/gemini-check', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '';
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  const prefix = apiKey ? `${apiKey.substring(0, 8)}...` : 'none';
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say ok');
    const text = (await result.response).text();
    return res.status(200).json({
      success: true,
      apiKeyPrefix: prefix,
      modelName,
      response: text
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      apiKeyPrefix: prefix,
      modelName,
      error: err.message
    });
  }
});

// ---- Phase 1: Authentication ----
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// ---- Phase 2: Notes + PYQs ----
app.use('/api/notes', noteRoutes);
app.use('/api/pyqs', pyqRoutes);
app.use('/api/academic', require('./routes/academicRoutes'));

// ---- Phase 3: Placements + Events ----
app.use('/api/placements', placementRoutes);
app.use('/api/events', eventRoutes);

// ---- Phase 4: Notifications + Complaints + Support Tickets ----
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/support-tickets', supportTicketRoutes);

// ---- Phase 5: AI Study Assistant ----
app.use('/api/ai', aiRoutes);

// ---- Phase 6: Analytics ----
app.use('/api/analytics', analyticsRoutes);

// ---- CampusConnect ERP Routes ----
app.use('/api/attendance', attendanceRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/fees', require('./routes/feeRoutes'));

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
