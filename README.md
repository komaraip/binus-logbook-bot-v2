# BINUS Logbook Bot 🤖

An automated bot that streamlines the process of submitting monthly student internship activity data to the BINUS University LMS. This bot reads activity data from an Excel file and automatically fills out the logbook entries, saving you hours of manual data entry.

### ✨ Key Features

- 🚀 **Automated Data Entry**: Fills out logbook entries automatically
- 📊 **Excel Integration**: Reads data directly from Excel files
- 🗓️ **Smart OFF Day Detection**: Automatically handles days marked as "OFF"
- ⚙️ **Flexible Configuration**: Customize month, semester, clock times, and Excel file path
- 🔒 **Secure**: Your credentials are stored locally and never shared
- ⚡ **Fast**: Processes multiple entries in minutes instead of hours
- 🛡️ **Error Handling**: Robust error handling with detailed logging
- 🔐 **2FA Support**: Compatible with Microsoft Authenticator two-factor authentication
- 💾 **Session Persistence**: Remember login state for faster subsequent runs
- 🌐 **Web Interface**: User-friendly web interface with real-time progress updates
- 📱 **Multiple Modes**: Run via CLI or web interface

## 🎯 Two Ways to Use

This bot offers **two modes of operation**:

1. **🖥️ CLI Mode (Command Line)**: Run directly from terminal - perfect for quick one-time executions
   ```bash
   npm start
   ```

2. **🌐 Web Interface**: User-friendly web UI with real-time progress - ideal for regular use
   ```bash
   npm run web
   ```
   Then open your browser to `http://localhost:3000`

## 🚀 Quick Start

### Prerequisites

Before you begin, make sure you have:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **BINUS University credentials** (email and password)
- **Microsoft Authenticator app** (if your account uses 2FA)
- **Excel file** with your monthly activity data

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd logbook_bot
```

#### 2. Install Dependencies

Open your terminal/command prompt in the project folder and run:

```bash
npm install
```

This will install all required packages for the bot to work.

#### 3. Configure Your Credentials

Create a `.env` file in the project root directory:

```bash
# Copy the example file (if available)
cp env.example .env

# Or create a new .env file manually
```

Add your BINUS credentials and configuration to the `.env` file:

```env
# Login credentials
EMAIL=your.email@binus.ac.id
PASSWORD=your_password

# Browser configuration (optional)
# In development: Uses Brave if installed at default location and BRAVE_PATH is set
# In production: Always uses Playwright's Chromium in headless mode
# Set custom path if Brave is installed in a different location (development only)
BRAVE_PATH=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe

# Clock in and out times (12-hour format: HH:MM am or pm)
CLOCK_IN_TIME="08:00 am"
CLOCK_OUT_TIME="05:00 pm"

# Logbook month (use month abbreviation)
# EVEN semester months: FEB, MAR, APR, MAY, JUN, JUL, AUG
# ODD semester months: SEP, OCT, NOV, DEC, JAN, FEB
LOGBOOK_MONTH=SEP

# Internship semester (EVEN or ODD)
# EVEN: 2420, ODD: 2510
INTERNSHIP_SEMESTER=ODD

# Excel file path
EXCEL_FILE_PATH=./src/data/monthly_activity.xlsx
```

> ⚠️ **Security Note**: Your credentials are stored locally on your machine and are never shared or uploaded anywhere.

#### 4. Prepare Your Excel Data

Navigate to the `src/data/` folder and modify the `monthly_activity.xlsx` file:

**Excel File Structure:**
- **Column A**: Date (optional, for reference)
- **Column B**: Activity (required)
- **Column C**: Description (required)

**Example Excel Data:**
| Date | Activity | Description |
|------|----------|-------------|
| 2025-01-01 | OFF | OFF |
| 2025-01-02 | Project Development | Working on frontend components |
| 2025-01-03 | Database Design | Creating database schema |
| 2025-01-04 | OFF | OFF |
| 2025-01-05 | Code Review | Reviewing team member's code |

**Important Notes:**
- For OFF days, put "OFF" in either the Activity or Description column
- Make sure all required fields are filled
- The bot will process rows in order from top to bottom

#### 5. Run the Bot

**Option A: CLI Mode** (Quick terminal-based execution)

Start the bot by running:

```bash
npm start
```

The bot will:
1. 🔐 Log into your BINUS account (with 2FA support)
2. 🧭 Navigate to the activity logbook section
3. 📊 Read your Excel data
4. 📝 Fill out each day's activities automatically
5. ✅ Submit all entries

**Option B: Web Interface** (User-friendly with real-time updates)

Start the web server:

```bash
npm run web
```

Then:
1. 🌐 Open your browser and go to `http://localhost:3000`
2. 📝 Fill in your credentials and settings in the web form
3. 📤 Upload your Excel file (or use the default one)
4. ▶️ Click "Start Bot" and watch real-time progress
5. 📊 View live updates and completion status

**For First-Time Users with 2FA:**

If your BINUS account uses Microsoft Authenticator for 2FA:

1. The bot will automatically enter your email and password
2. You'll see this message in the console:
   ```
   🔐 ============================================
   📱 2FA REQUIRED: Please approve the login request
      on your Microsoft Authenticator app
   🔐 ============================================
   ```
3. **Open your Microsoft Authenticator app** on your phone
4. **Approve the login request** (you have 2 minutes)
5. The bot will automatically detect approval and continue
6. Your session will be saved for future runs - **no 2FA needed next time!**

**For Subsequent Runs:**

The bot will automatically use your saved session - no login or 2FA needed! This makes it much faster. If your session expires, you'll be asked to approve 2FA again.

**Clearing Saved Session:**

If you want to force a fresh login (e.g., switching accounts or troubleshooting):

```bash
npm run clear-session
```

Then run the bot normally:

```bash
npm start
```

### 🌐 Using the Web Interface

The web interface provides a more user-friendly experience with real-time updates:

**Starting the Web Server:**

```bash
npm run web
```

For development with auto-reload:

```bash
npm run dev
```

**Features:**

- 📝 **Easy Configuration**: Fill in credentials and settings through a form
- 📤 **File Upload**: Upload your Excel file directly through the browser
- 📥 **Download Template**: Download the Excel template with proper format
- 📊 **Real-Time Progress**: See live updates as the bot processes each entry
- 🔴 **Stop Control**: Stop the bot at any time
- 🔄 **Session Management**: Clear saved sessions with one click
- 📱 **Responsive Design**: Works on desktop and mobile devices

**Using the Web Interface:**

1. **Start the server** and navigate to `http://localhost:3000`
2. **Configure settings:**
   - Enter your BINUS email and password
   - Set clock in/out times (e.g., "08:00 am" and "05:00 pm")
   - Select logbook month and semester
3. **Upload Excel file** (optional - it will use the default file if not uploaded)
4. **Click "Start Bot"** and watch the progress in real-time
5. **Monitor status** through the progress updates and logs
6. **Bot will notify** when completed or if any errors occur

**API Endpoints:**

The web interface uses these endpoints (useful for custom integrations):

- `POST /api/start` - Start the bot
- `GET /api/status` - Get current bot status
- `POST /api/stop` - Stop the running bot
- `POST /api/upload` - Upload Excel file
- `POST /api/clear-session` - Clear saved session
- `GET /api/events` - Server-Sent Events for real-time updates
- `GET /template/monthly_activity.xlsx` - Download Excel template

## 📁 Project Structure

```
logbook_bot/
├── src/
│   ├── core/           # Core bot functionality
│   │   ├── bot.ts      # Main bot logic
│   │   └── login.ts    # Login automation
│   ├── constant/       # Configuration files
│   │   ├── locator.ts  # Web element selectors
│   │   └── url.ts      # URL constants
│   ├── data/           # Data files
│   │   └── monthly_activity.xlsx  # Your activity data
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   │   └── mapping.ts  # Month/semester mapping
│   ├── main.ts         # CLI entry point
│   ├── server.ts       # Web server entry point
│   └── clear-session.ts # Session clearing utility
├── public/             # Web interface files
│   ├── index.html      # Web UI
│   ├── script.js       # Frontend JavaScript
│   └── styles.css      # Styling
├── data/
│   └── session/        # Saved login sessions
├── package.json        # Project dependencies
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## 🔧 Configuration Options

### Environment Variables

| Variable | Description | Example | Options |
|----------|-------------|---------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` | `development` (visible browser), `production` (headless) |
| `PORT` | Web server port (web mode only) | `3000` | Any valid port number |
| `BASE_PATH` | Subfolder path (web mode only) | `/binuslogbookbot` | Any valid path |
| `EMAIL` | Your BINUS email address | `john.doe@binus.ac.id` | - |
| `PASSWORD` | Your BINUS password | `your_password` | - |
| `BRAVE_PATH` | Path to Brave browser (optional, dev only) | `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe` | Any valid browser path |
| `CLOCK_IN_TIME` | Clock-in time (12-hour format) | `"08:00 am"` | Any valid time |
| `CLOCK_OUT_TIME` | Clock-out time (12-hour format) | `"05:00 pm"` | Any valid time |
| `LOGBOOK_MONTH` | Month for logbook entries | `SEP` | FEB, MAR, APR, MAY, JUN, JUL, AUG, SEP, OCT, NOV, DEC, JAN |
| `INTERNSHIP_SEMESTER` | Semester type | `ODD` | EVEN, ODD |
| `EXCEL_FILE_PATH` | Path to your Excel file | `./src/data/monthly_activity.xlsx` | Any valid file path |

### Month and Semester Configuration

The bot supports flexible month and semester configuration:

**Month Options:**
- **EVEN Semester**: FEB, MAR, APR, MAY, JUN, JUL, AUG
- **ODD Semester**: SEP, OCT, NOV, DEC, JAN, FEB

**Semester Options:**
- **EVEN**: Maps to semester code 2420
- **ODD**: Maps to semester code 2510

**Examples:**
```env
# For September (ODD semester)
LOGBOOK_MONTH=SEP
INTERNSHIP_SEMESTER=ODD

# For February (can be either semester)
LOGBOOK_MONTH=FEB
INTERNSHIP_SEMESTER=EVEN  # or ODD
```

### Excel File Configuration

The bot expects your Excel file to have:
- **Header row**: Can be skipped (the bot starts from row 2)
- **Column B**: Activity name
- **Column C**: Activity description
- **OFF days**: Mark with "OFF" in either Activity or Description column

**Custom Excel File Path:**
You can specify a custom path to your Excel file using the `EXCEL_FILE_PATH` environment variable:
```env
EXCEL_FILE_PATH=./path/to/your/custom_activity.xlsx
```

## � Two-Factor Authentication (2FA) Support

This bot **fully supports** BINUS accounts that use Microsoft Authenticator for 2FA!

### How It Works

**First Run (with 2FA):**
1. Bot enters your email and password automatically
2. Microsoft sends a notification to your Authenticator app
3. Console displays: *"📱 2FA REQUIRED: Please approve the login request"*
4. You approve the request on your phone (within 2 minutes)
5. Bot automatically detects approval and continues
6. Session is saved to `data/session/` for future use

**Subsequent Runs (no 2FA needed):**
1. Bot checks for saved session
2. If valid, skips login entirely - starts working immediately!
3. If expired, prompts for 2FA approval again

### 2FA Best Practices

✅ **DO:**
- Keep your phone nearby when running the bot for the first time
- Approve the request as soon as it appears on your phone
- Make sure both your PC and phone have internet connection
- Use `npm run clear-session` if you need to switch BINUS accounts

❌ **DON'T:**
- Don't close the bot while waiting for 2FA approval
- Don't let the 2 minute timer expire (approve quickly)
- Don't share your `data/session/` folder with others

### Troubleshooting 2FA

**"2FA approval timeout" error:**
- You have 2 minutes to approve - try to approve faster
- Check if Microsoft Authenticator is working on your phone
- Ensure both devices have stable internet connection

**Session not working:**
```bash
# Clear the saved session and try again
npm run clear-session
npm start
```

**Switching accounts:**
```bash
# Clear session, update .env with new credentials
npm run clear-session
# Edit .env file with new EMAIL and PASSWORD
npm start
```

## ️ Troubleshooting

### Common Issues

**Q: Browser executable not found / Chromium error**
- **Solution 1 (Recommended):** Use Brave browser - already configured!
  - Make sure Brave is installed at: `C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe`
  - Or set custom path in `.env`: `BRAVE_PATH=your\custom\path\to\brave.exe`
- **Solution 2:** Install Playwright browsers:
  ```bash
  npx playwright install chromium
  ```
- **Solution 3:** Leave `BRAVE_PATH` empty in `.env` to use Playwright's bundled Chromium

**Q: The bot can't find my Excel file**
- Check the `EXCEL_FILE_PATH` in your `.env` file
- Make sure the file path is correct and the file exists
- Check that the file is not open in Excel while running the bot
- Default path is `./src/data/monthly_activity.xlsx`

**Q: Login failed**
- Verify your credentials in the `.env` file
- Make sure you're using your BINUS email and password
- If using 2FA: Make sure to approve the request on Microsoft Authenticator within 2 minutes
- If session issues occur, delete the `data/session/` folder and try again

**Q: 2FA approval timeout**
- Make sure your phone is nearby and Microsoft Authenticator is working
- You have 2 minutes to approve the request
- Check your internet connection on both PC and phone
- Try approving the request as soon as the notification appears

**Q: Session expired or not working**
- Delete the saved session: remove the `data/session/` folder
- Run the bot again and approve 2FA when prompted
- The bot will save a fresh session after successful login

**Q: The bot stops at a specific row**
- Check the console output for error messages
- Verify that the Excel data for that row is properly formatted
- Ensure the LMS page has loaded completely

**Q: OFF days are not being handled correctly**
- Make sure "OFF" is written exactly as "OFF" (case-sensitive)
- Check that it's in either the Activity or Description column

**Q: Wrong month or semester is being used**
- Check your `LOGBOOK_MONTH` setting (use month abbreviation like SEP, OCT, etc.)
- Verify your `INTERNSHIP_SEMESTER` setting (EVEN or ODD)
- Make sure the month matches the semester (EVEN: FEB-AUG, ODD: SEP-JAN)

**Q: Clock times are not working correctly**
- Use 12-hour format with am/pm (e.g., "08:00 am", "05:00 pm")
- Make sure to include quotes around the time values
- Check that the format matches exactly: "HH:MM am/pm"

**Q: No browser appears on my cPanel/server**
- This is expected! The bot runs in **headless mode** on servers (no GUI)
- Make sure `NODE_ENV=production` is set in your `.env` file
- The bot works in the background without showing a browser window
- Check the logs/console output to monitor progress

## 📜 Available NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `start` | `npm start` | Run bot in CLI mode |
| `web` | `npm run web` | Start web interface server |
| `dev` | `npm run dev` | Start web server with auto-reload (development) |
| `build` | `npm run build` | Compile TypeScript to JavaScript |
| `start:prod` | `npm run start:prod` | Run compiled web server (production) |
| `clear-session` | `npm run clear-session` | Clear saved login session |

### Getting Help

If you encounter issues:

1. **Check the console output** for detailed error messages
2. **Verify your Excel data** is properly formatted
3. **Ensure your credentials** are correct
4. **Check your internet connection** and BINUS LMS accessibility

## 🔒 Security & Privacy

- ✅ **Local Storage**: All data stays on your computer
- ✅ **No Data Sharing**: Your credentials are never transmitted to external servers
- ✅ **Secure Login**: Uses the same login process as manual access
- ✅ **Temporary Files**: Any temporary files are cleaned up automatically

## 📝 License

This project is licensed under the Freeware License.

## 🤝 Contributing

Contributions are welcome! If you find a bug or have a feature request, please open an issue or submit a pull request.

## ⚠️ Disclaimer

This bot is for educational and productivity purposes. Use it responsibly and in accordance with your university's policies. The authors are not responsible for any misuse of this tool.

---

**Happy Automating! 🚀**

*Save time, focus on learning, let the bot handle the paperwork.*
