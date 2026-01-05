import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import LoginBot from './core/login.js';
import ActivityBot from './core/bot.js';
import { BotConfig } from './types/bot.js';
import { getMonthName, getSemesterCode } from './utils/mapping.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_PATH = process.env.BASE_PATH || ''; // Support for subfolder deployment

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(BASE_PATH, express.static(path.join(__dirname, '../public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, _file, cb) => {
    cb(null, 'monthly_activity.xlsx');
  }
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed!'));
    }
  }
});

// Store bot instances and their states
let currentBot: { login: LoginBot | null; activity: ActivityBot | null; isRunning: boolean } = {
  login: null,
  activity: null,
  isRunning: false
};

// SSE connections for real-time updates
const sseClients: Response[] = [];

function sendSSE(data: any) {
  sseClients.forEach(client => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Create router for subfolder support
const router = express.Router();

// Routes
router.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Serve Excel template for download
router.get('/template/monthly_activity.xlsx', (_req: Request, res: Response) => {
  const templatePath = path.join(__dirname, 'data', 'monthly_activity.xlsx');
  res.download(templatePath, 'monthly_activity.xlsx', (err) => {
    if (err) {
      res.status(404).json({ success: false, message: 'Template file not found' });
    }
  });
});

// SSE endpoint for real-time updates
router.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// Upload Excel file
router.post('/api/upload', upload.single('excelFile'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded' });
      return;
    }
    res.json({ success: true, message: 'File uploaded successfully', filename: req.file.filename });
  } catch (error) {
    res.status(500).json({ success: false, message: 'File upload failed', error: String(error) });
  }
});

// Start bot
router.post('/api/start', async (req: Request, res: Response): Promise<void> => {
  try {
    if (currentBot.isRunning) {
      res.status(400).json({ success: false, message: 'Bot is already running' });
      return;
    }

    const { email, password, clockInTime, clockOutTime, logbookMonth, internshipSemester } = req.body;

    if (!email || !password || !clockInTime || !clockOutTime || !logbookMonth || !internshipSemester) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    // Set environment variables temporarily
    process.env.EMAIL = email;
    process.env.PASSWORD = password;
    process.env.CLOCK_IN_TIME = clockInTime;
    process.env.CLOCK_OUT_TIME = clockOutTime;

    currentBot.isRunning = true;

    // Send initial status
    sendSSE({ type: 'status', message: 'Starting bot...', status: 'running' });

    // Run bot in background
    runBot(logbookMonth, internshipSemester)
      .then(() => {
        currentBot.isRunning = false;
        sendSSE({ type: 'complete', message: 'Bot completed successfully!', status: 'completed' });
      })
      .catch((error) => {
        currentBot.isRunning = false;
        sendSSE({ type: 'error', message: `Bot failed: ${error.message}`, status: 'error' });
      });

    res.json({ success: true, message: 'Bot started successfully' });
  } catch (error) {
    currentBot.isRunning = false;
    res.status(500).json({ success: false, message: 'Failed to start bot', error: String(error) });
  }
});

// Get bot status
router.get('/api/status', (_req: Request, res: Response) => {
  const state = currentBot.activity?.getState() || {
    currentRow: 0,
    totalRows: 0,
    processedDates: [],
    errors: []
  };

  res.json({
    success: true,
    isRunning: currentBot.isRunning,
    state
  });
});

// Stop bot
router.post('/api/stop', async (_req: Request, res: Response): Promise<void> => {
  try {
    if (!currentBot.isRunning) {
      res.status(400).json({ success: false, message: 'Bot is not running' });
      return;
    }

    if (currentBot.login) {
      await currentBot.login.close();
    }

    currentBot.isRunning = false;
    currentBot.login = null;
    currentBot.activity = null;

    sendSSE({ type: 'stopped', message: 'Bot stopped by user', status: 'stopped' });

    res.json({ success: true, message: 'Bot stopped successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to stop bot', error: String(error) });
  }
});

// Clear session
router.post('/api/clear-session', (_req: Request, res: Response) => {
  try {
    const sessionFile = path.join(process.cwd(), 'data', 'session', 'auth-session.json');
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
      res.json({ success: true, message: 'Session cleared successfully' });
    } else {
      res.json({ success: true, message: 'No session to clear' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear session', error: String(error) });
  }
});

// Mount the router with BASE_PATH support
app.use(BASE_PATH, router);

// Main bot execution function
async function runBot(logbookMonth: string, internshipSemester: string) {
  const loginBot = new LoginBot();
  currentBot.login = loginBot;

  try {
    sendSSE({ type: 'status', message: 'Logging in to BINUS...', status: 'running' });

    const success = await loginBot.login();

    if (!success) {
      throw new Error('Login failed');
    }

    sendSSE({ type: 'status', message: 'Login successful! Initializing activity bot...', status: 'running' });

    const botConfig: BotConfig = {
      clockInTime: process.env.CLOCK_IN_TIME || '08:00 am',
      clockOutTime: process.env.CLOCK_OUT_TIME || '05:00 pm',
      excelFilePath: process.env.EXCEL_FILE_PATH || path.join(process.cwd(), 'src', 'data', 'monthly_activity.xlsx'),
      logbookMonth: getMonthName(logbookMonth),
      internshipSemester: getSemesterCode(internshipSemester)
    };

    const activityBot = new ActivityBot(loginBot.getPage()!, botConfig);
    currentBot.activity = activityBot;

    sendSSE({ type: 'status', message: 'Navigating to activity page...', status: 'running' });
    await activityBot.navigateToActivityPage();

    sendSSE({ type: 'status', message: 'Filling activities...', status: 'running' });
    await activityBot.fillAllActivities();

    const state = activityBot.getState();
    const errors = activityBot.getErrors();

    sendSSE({
      type: 'progress',
      message: `Processed ${state.processedDates.length} dates`,
      processed: state.processedDates.length,
      total: state.totalRows,
      errors: errors.length
    });

  } catch (error) {
    throw error;
  } finally {
    await loginBot.close();
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Open your browser and navigate to http://localhost:${PORT}`);
});
