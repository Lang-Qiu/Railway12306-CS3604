const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  BLUE: '\x1b[34m',
  GRAY: '\x1b[90m'
};

const currentLevel = process.env.LOG_LEVEL ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] : LOG_LEVELS.INFO;

function formatMessage(level, message, ...args) {
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  // Core information only, no decorative characters like stars or dashes
  return `${timestamp} [${level}] ${message} ${args.length ? JSON.stringify(args) : ''}`;
}

const logger = {
  error: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.ERROR) {
      console.error(`${COLORS.RED}${formatMessage('ERROR', message, ...args)}${COLORS.RESET}`);
    }
  },
  warn: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.WARN) {
      console.warn(`${COLORS.YELLOW}${formatMessage('WARN', message, ...args)}${COLORS.RESET}`);
    }
  },
  info: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.INFO) {
      console.log(`${COLORS.GREEN}${formatMessage('INFO', message, ...args)}${COLORS.RESET}`);
    }
  },
  debug: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.DEBUG) {
      console.log(`${COLORS.BLUE}${formatMessage('DEBUG', message, ...args)}${COLORS.RESET}`);
    }
  }
};

module.exports = logger;
