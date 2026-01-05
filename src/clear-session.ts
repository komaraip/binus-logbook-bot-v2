import * as fs from 'fs';
import * as path from 'path';

/**
 * Clear saved login session
 * Run this if you want to force a fresh login with 2FA
 */
function clearSession() {
  const sessionDir = path.join(process.cwd(), 'data', 'session');
  const sessionFile = path.join(sessionDir, 'auth-session.json');
  
  try {
    if (fs.existsSync(sessionFile)) {
      fs.unlinkSync(sessionFile);
      console.log('✅ Session cleared successfully!');
      console.log('📝 Next run will require fresh login with 2FA approval');
    } else {
      console.log('ℹ️  No saved session found');
    }
    
    // Also remove session directory if empty
    if (fs.existsSync(sessionDir) && fs.readdirSync(sessionDir).length === 0) {
      fs.rmdirSync(sessionDir);
      console.log('🗑️  Removed empty session directory');
    }
    
  } catch (error) {
    console.error('❌ Error clearing session:', error);
    process.exit(1);
  }
}

clearSession();
