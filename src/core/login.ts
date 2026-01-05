import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { LOGIN_LOCATORS } from '../constant/locator.js';
import { URLS } from '../constant/url.js';
import { LoginCredentials } from '../types/login.js';
import * as fs from 'fs';
import * as path from 'path';

class LoginBot {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private readonly SESSION_DIR = path.join(process.cwd(), 'data', 'session');
  private readonly SESSION_FILE = path.join(this.SESSION_DIR, 'auth-session.json');

  constructor() {
    // Ensure session directory exists
    if (!fs.existsSync(this.SESSION_DIR)) {
      fs.mkdirSync(this.SESSION_DIR, { recursive: true });
    }
    
    // Ensure data directory exists for screenshots/debug files
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  /**
   * Load credentials from environment variables
   */
  private loadCredentials(): LoginCredentials {
    const email = process.env.EMAIL;
    const password = process.env.PASSWORD;

    if (!email || !password) {
      throw new Error('Missing credentials. Please set EMAIL and PASSWORD environment variables.');
    }

    return { email, password };
  }

  /**
   * Check if a valid session exists
   */
  private hasValidSession(): boolean {
    return fs.existsSync(this.SESSION_FILE);
  }

  /**
   * Initialize browser with stateful context (with or without saved session)
   */
  private async initializeBrowser(useSavedSession: boolean = false): Promise<void> {
    // Detect if running in production/server environment
    const isProduction = process.env.NODE_ENV === 'production' || !process.env.BRAVE_PATH;
    
    // Use Brave browser only for local development
    const bravePath = process.env.BRAVE_PATH || 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
    
    const launchOptions: any = {
      headless: isProduction, // Headless mode for production, visible for local development
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    // Only use Brave browser for local development
    if (!isProduction && fs.existsSync(bravePath)) {
      launchOptions.executablePath = bravePath;
      launchOptions.slowMo = 1000; // Slow down for visibility in local dev
      console.log(`🌐 Launching browser (Local): ${bravePath}`);
    } else {
      console.log('🌐 Launching browser (Production/Headless mode)');
    }
    
    try {
      this.browser = await chromium.launch(launchOptions);
      console.log('✅ Browser launched successfully');
    } catch (error) {
      console.error('❌ Failed to launch browser:', error);
      throw error;
    }

    if (useSavedSession && this.hasValidSession()) {
      // Load saved session
      console.log('🔑 Loading saved session...');
      const sessionData = JSON.parse(fs.readFileSync(this.SESSION_FILE, 'utf-8'));
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        storageState: sessionData
      });
      console.log('✅ Session loaded successfully');
    } else {
      // Create new context without session
      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      });
    }

    this.page = await this.context.newPage();
  }

  /**
   * Save the current session to disk
   */
  private async saveSession(): Promise<void> {
    try {
      const sessionData = await this.context!.storageState();
      fs.writeFileSync(this.SESSION_FILE, JSON.stringify(sessionData, null, 2));
      console.log('💾 Session saved successfully');
    } catch (error) {
      console.error('⚠️  Failed to save session:', error);
    }
  }

  /**
   * Clear saved session
   */
  public clearSession(): void {
    if (fs.existsSync(this.SESSION_FILE)) {
      fs.unlinkSync(this.SESSION_FILE);
      console.log('🗑️  Session cleared');
    }
  }

  /**
   * Navigate to login page
   */
  private async navigateToLoginPage(): Promise<void> {
    console.log(`🌐 Navigating to: ${URLS.LOGIN_PAGE}`);
    try {
      await this.page!.goto(URLS.LOGIN_PAGE, { 
        waitUntil: 'networkidle', // More reliable for production
        timeout: 60000 
      });
      console.log('✅ Login page loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load login page:', error);
      throw error;
    }
  }

  /**
   * Step 2: Click initial login button
   */
  private async clickInitialLoginButton(): Promise<void> {
    console.log('🔘 Looking for initial login button...');
    try {
      await this.page!.waitForSelector(LOGIN_LOCATORS.INITIAL_LOGIN_BUTTON, { 
        timeout: 60000,
        state: 'visible' 
      });
      console.log('✅ Initial login button found, clicking...');
      await this.page!.click(LOGIN_LOCATORS.INITIAL_LOGIN_BUTTON);
      await this.page!.waitForTimeout(3000);
      console.log('✅ Initial login button clicked');
    } catch (error) {
      console.error('❌ Failed to click initial login button:', error);
      console.error(`   Selector used: ${LOGIN_LOCATORS.INITIAL_LOGIN_BUTTON}`);
      console.error(`   Current URL: ${this.page!.url()}`);
      throw error;
    }
  }

  /**
   * Step 3: Click Microsoft sign in button
   */
  private async clickMicrosoftSignInButton(): Promise<void> {
    console.log('🔘 Looking for Microsoft sign in button...');
    try {
      await this.page!.waitForSelector(LOGIN_LOCATORS.MICROSOFT_SIGNIN_BUTTON, { 
        timeout: 60000,
        state: 'visible' 
      });
      console.log('✅ Microsoft sign in button found, clicking...');
      await this.page!.click(LOGIN_LOCATORS.MICROSOFT_SIGNIN_BUTTON);
      await this.page!.waitForTimeout(3000);
      console.log('✅ Microsoft sign in button clicked');
    } catch (error) {
      console.error('❌ Failed to click Microsoft sign in button:', error);
      console.error(`   Selector used: ${LOGIN_LOCATORS.MICROSOFT_SIGNIN_BUTTON}`);
      console.error(`   Current URL: ${this.page!.url()}`);
      throw error;
    }
  }

  /**
   * Step 4: Fill email and click next
   */
  private async fillEmailAndNext(credentials: LoginCredentials): Promise<void> {
    await this.page!.waitForSelector(LOGIN_LOCATORS.EMAIL_INPUT, { timeout: 30000 });
    await this.page!.fill(LOGIN_LOCATORS.EMAIL_INPUT, credentials.email);
    
    console.log('📧 Email entered, looking for Next button...');
    
    // Wait a bit for the page to enable the button
    await this.page!.waitForTimeout(1000);
    
    // Try multiple possible selectors for the next button
    const nextButtonSelectors = [
      'input#idSIButton9[type="submit"]', // Most specific
      '#idSIButton9',
      'input[type="submit"][value="Next"]',
      'input[type="submit"][value="Sign in"]',
      'button[type="submit"]',
      'input#idSIButton9',
      'input[type="submit"]', // Most general
      'button:has-text("Next")',
      'input:has-text("Next")'
    ];
    
    let buttonClicked = false;
    for (const selector of nextButtonSelectors) {
      try {
        console.log(`  Trying selector: ${selector}`);
        const element = await this.page!.waitForSelector(selector, { timeout: 5000, state: 'visible' });
        if (element) {
          await element.click();
          buttonClicked = true;
          console.log(`  ✅ Clicked button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Try next selector
      }
    }
    
    if (!buttonClicked) {
      try {
        // Try to take screenshot for debugging
        if (this.page && !this.page.isClosed()) {
          await this.page.screenshot({ path: 'debug-email-page.png' });
          console.log('  📸 Screenshot saved to debug-email-page.png');
        }
      } catch (screenshotError) {
        // Ignore screenshot errors
      }
      throw new Error('Could not find the next button with any of the expected selectors');
    }
    
    await this.page!.waitForTimeout(2000); // Faster than waiting for full page load
  }

  /**
   * Step 6: Fill password and sign in (or handle 2FA if triggered earlier)
   */
  private async fillPasswordAndSignIn(credentials: LoginCredentials): Promise<void> {
    try {
      // Check current URL to determine where we are in the flow
      const currentUrl = this.page!.url();
      console.log(`📍 Current URL: ${currentUrl}`);
      
      // Check if we're actually ON a BINUS domain (not just referenced in URL params)
      const urlObj = new URL(currentUrl);
      const hostname = urlObj.hostname;
      
      // If already at KMSI or actually on a BINUS domain (not login.microsoft), skip password
      if (currentUrl.includes('/kmsi') || 
          (hostname.includes('binus.ac.id') && !hostname.includes('microsoft'))) {
        console.log('⏭️  Skipping password entry - already authenticated');
        return;
      }
      
      // If at 2FA page (/SAS/ProcessAuth), skip password and handle 2FA
      if (currentUrl.includes('/SAS/ProcessAuth') || currentUrl.includes('/SAS/')) {
        console.log('🔐 2FA triggered before password - waiting for approval...');
        return; // Will be handled by waitFor2FAApproval
      }

      // Otherwise, proceed with password entry
      console.log('🔑 Entering password...');
      await this.page!.waitForSelector(LOGIN_LOCATORS.PASSWORD_INPUT, { timeout: 10000 });
      await this.page!.fill(LOGIN_LOCATORS.PASSWORD_INPUT, credentials.password);
      
      // Wait a moment for the password to be processed
      await this.page!.waitForTimeout(1000);
      
      console.log('👆 Looking for Sign In button...');
      
      // Try multiple selectors for the sign in button
      const signInSelectors = [
        LOGIN_LOCATORS.PASSWORD_SIGNIN_BUTTON,
        'input#idSIButton9[type="submit"]',
        'input[type="submit"][value="Sign in"]',
        'button#idSIButton9',
        'input#idSIButton9',
        'button[type="submit"]',
        'input[type="submit"]'
      ];
      
      let buttonClicked = false;
      for (const selector of signInSelectors) {
        try {
          console.log(`  Trying selector: ${selector}`);
          await this.page!.waitForSelector(selector, { timeout: 5000, state: 'visible' });
          await this.page!.click(selector);
          console.log(`  ✅ Clicked Sign In button with selector: ${selector}`);
          buttonClicked = true;
          break;
        } catch (error) {
          // Try next selector
        }
      }
      
      if (!buttonClicked) {
        console.error('⚠️  Could not find Sign In button, trying to press Enter...');
        // Try pressing Enter as fallback
        await this.page!.press(LOGIN_LOCATORS.PASSWORD_INPUT, 'Enter');
      }
      
      await this.page!.waitForTimeout(3000); // Wait for the page to process
      
    } catch (error: any) {
      // Check if we navigated to 2FA, KMSI or dashboard despite the error
      const currentUrl = this.page!.url();
      console.log(`📍 After error, current URL: ${currentUrl}`);
      
      const urlObj = new URL(currentUrl);
      const hostname = urlObj.hostname;
      
      if (currentUrl.includes('/kmsi') || 
          hostname.includes('binus.ac.id') || 
          currentUrl.includes('/SAS/ProcessAuth')) {
        console.log('✅ Successfully authenticated - navigated to dashboard!');
        return;
      }
      throw error;
    }
  }

  /**
   * Step 7: Wait for 2FA approval (Microsoft Authenticator)
   */
  private async waitFor2FAApproval(): Promise<void> {
    // Check if we're already past 2FA (at KMSI page or dashboard)
    const currentUrl = this.page!.url();
    console.log(`🔍 Checking current URL for 2FA status: ${currentUrl}`);
    
    if (currentUrl.includes('/kmsi') || currentUrl.includes('binus.ac.id')) {
      console.log('✅ Already authenticated (2FA not required or already approved)');
      return;
    }

    console.log('\n🔐 ============================================');
    console.log('📱 2FA REQUIRED: Please approve the login request');
    console.log('   on your Microsoft Authenticator app');
    console.log('🔐 ============================================\n');
    
    const maxWaitTime = 120000; // 2 minutes timeout
    const startTime = Date.now();
    
    try {
      // Wait for either:
      // 1. Stay signed in prompt (successful 2FA) - supports multiple languages
      // 2. Dashboard URL (2FA bypassed or already approved)
      // 3. Any BINUS domain URL (successful authentication)
      // 4. KMSI page (Keep me signed in)
      
      await this.page!.waitForFunction(
        () => {
          const url = window.location.href;
          // Check for BINUS domain or KMSI page
          if (url.includes('binus.ac.id') || url.includes('/kmsi')) {
            return true;
          }
          // Check for Stay signed in button (English or Indonesian)
          const yesButton = document.querySelector('input#idSIButton9[value="Yes"]');
          const yaButton = document.querySelector('input#idSIButton9[value="Ya"]');
          const genericButton = document.querySelector('input#idSIButton9[type="submit"]');
          return yesButton !== null || yaButton !== null || genericButton !== null;
        },
        { timeout: maxWaitTime }
      );
      
      const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
      const finalUrl = this.page!.url();
      console.log(`✅ 2FA approved successfully (${elapsedTime}s)`);
      console.log(`📍 Current URL: ${finalUrl}`);
      
    } catch (error) {
      const currentUrl = this.page!.url();
      console.error('\n❌ 2FA approval timeout!');
      console.error(`   Current URL: ${currentUrl}`);
      console.error('   Please make sure to approve the request within 2 minutes.');
      throw new Error('2FA approval timeout - login failed');
    }
  }

  /**
   * Step 8: Handle "Stay signed in" prompt (supports multiple languages)
   */
  private async handleStaySignedIn(): Promise<void> {
    try {
      console.log('🔍 Checking for "Stay signed in" prompt...');
      
      // Multiple selectors for different languages and button formats
      const staySignedInSelectors = [
        // English
        'input#idSIButton9[type="submit"][value="Yes"]',
        'button:has-text("Yes")',
        'input[value="Yes"]',
        // Indonesian
        'input#idSIButton9[type="submit"][value="Ya"]',
        'button:has-text("Ya")',
        'input[value="Ya"]',
        // Generic selectors
        'input#idSIButton9[type="submit"]',
        'button#idSIButton9',
        'input#idSIButton9'
      ];
      
      let buttonClicked = false;
      for (const selector of staySignedInSelectors) {
        try {
          console.log(`  Trying selector: ${selector}`);
          await this.page!.waitForSelector(selector, { timeout: 3000 });
          await this.page!.click(selector);
          console.log(`  ✅ Clicked "Stay signed in" button with selector: ${selector}`);
          buttonClicked = true;
          break;
        } catch (error) {
          // Try next selector
        }
      }
      
      if (buttonClicked) {
        console.log('✅ "Stay signed in" handled successfully');
        await this.page!.waitForTimeout(5000); // Wait for navigation
      } else {
        console.log('ℹ️  "Stay signed in" prompt not found - may have been skipped');
      }
      
    } catch (error) {
      console.log('ℹ️  "Stay signed in" prompt not found or already handled');
    }
  }


  /**
   * Main login process
   */
  public async login(): Promise<boolean> {
    try {
      console.log('🚀 ===== LOGIN PROCESS STARTED =====');
      
      // Check if we have a saved session
      if (this.hasValidSession()) {
        console.log('🔄 Attempting to use saved session...');
        
        // Initialize browser with saved session
        await this.initializeBrowser(true);
        
        // Try to navigate directly to the dashboard
        await this.page!.goto(URLS.LOGIN_PAGE, { 
          waitUntil: 'networkidle',
          timeout: 60000 
        });
        
        await this.page!.waitForTimeout(3000);
        
        // Check if we're already logged in (redirected to dashboard)
        const currentUrl = this.page!.url();
        console.log(`📍 Current URL after session load: ${currentUrl}`);
        
        if (currentUrl.includes('binus.ac.id') && !currentUrl.includes('/Login')) {
          console.log('✅ Session is still valid - logged in successfully!');
          return true;
        }
        
        // Session expired, clear it and proceed with fresh login
        console.log('⚠️  Session expired, performing fresh login...');
        this.clearSession();
        await this.close();
      }
      
      // Fresh login process
      console.log('🔑 Starting fresh login process...');
      
      // Load credentials
      const credentials = this.loadCredentials();
      console.log(`📧 Using email: ${credentials.email}`);
      
      // Initialize browser (without session)
      await this.initializeBrowser(false);
      
      // Navigate to login page
      console.log('Step 1: Navigate to login page');
      await this.navigateToLoginPage();
      
      // Step 2: Click initial login button
      console.log('Step 2: Click initial login button');
      await this.clickInitialLoginButton();
      
      // Step 3: Click Microsoft sign in button
      console.log('Step 3: Click Microsoft sign in button');
      await this.clickMicrosoftSignInButton();
      
      // Step 4: Fill email and click next
      console.log('Step 4: Fill email and click next');
      await this.fillEmailAndNext(credentials);
      
      // Step 6: Fill password and sign in
      console.log('Step 5: Fill password and sign in');
      await this.fillPasswordAndSignIn(credentials);
      
      // Step 7: Wait for 2FA approval
      console.log('Step 6: Wait for 2FA approval');
      await this.waitFor2FAApproval();
      
      // Step 8: Handle stay signed in prompt
      console.log('Step 7: Handle stay signed in prompt');
      await this.handleStaySignedIn();
      
      // Save session after successful login
      console.log('Step 8: Save session');
      await this.saveSession();
      
      console.log('✅ ===== LOGIN COMPLETED SUCCESSFULLY! =====');
      return true;
      
    } catch (error: any) {
      console.error('❌ ===== LOGIN FAILED =====');
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
      
      // Try to capture screenshot for debugging
      try {
        if (this.page && !this.page.isClosed()) {
          const screenshotPath = path.join(process.cwd(), 'data', 'login-error.png');
          await this.page.screenshot({ path: screenshotPath, fullPage: true });
          console.error(`📸 Screenshot saved to: ${screenshotPath}`);
          
          // Save page HTML for debugging
          const htmlPath = path.join(process.cwd(), 'data', 'login-error.html');
          const content = await this.page.content();
          fs.writeFileSync(htmlPath, content);
          console.error(`📄 Page HTML saved to: ${htmlPath}`);
          
          console.error(`📍 Current URL: ${this.page.url()}`);
        }
      } catch (debugError) {
        console.error('Could not capture debug info:', debugError);
      }
      
      return false;
    }
  }

  /**
   * Close browser and cleanup
   */
  public async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
    }
  }

  /**
   * Get current page for further operations
   */
  public getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current context for further operations
   */
  public getContext(): BrowserContext | null {
    return this.context;
  }

}

export default LoginBot;
