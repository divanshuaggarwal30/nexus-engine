// 1. Cache DOM Elements (Grab them once for high performance!)
const seedUrlInput = document.getElementById('seed-url');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const crawlStatus = document.getElementById('crawl-status');
const logTerminal = document.getElementById('log-terminal');

// Track whether we need to clear the initial "System initialized..." placeholder text
let isFirstLog = true;

/**
 * Prints a timestamped message to our dark-mode terminal window.
 * @param {string} message - The text to display.
 * @param {string} type - 'INFO', 'SUCCESS', 'WARN', or 'ERROR'.
 */
function log(message, type = 'INFO') {
  // If this is the very first message, wipe away the HTML placeholder text
  if (isFirstLog) {
    logTerminal.textContent = '';
    isFirstLog = false;
  }

  // Generate a clean HH:MM:SS timestamp
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] [${type}] ${message}\n`;

  // Append the new log line to the terminal window
  logTerminal.textContent += logLine;
  
  // Force the scrollbar to jump to the very bottom so we always see the latest log
  logTerminal.scrollTop = logTerminal.scrollHeight;
}

// 2. Attach Event Listeners to our Buttons
startBtn.addEventListener('click', () => {
  const url = seedUrlInput.value.trim();

  // Basic validation: Make sure the user actually typed something
  if (!url) {
    log('Please enter a valid target URL before starting the engine.', 'ERROR');
    return;
  }

  // Update our UI status text
  crawlStatus.textContent = 'Status: Engine Running...';
  log(`Booting crawler engine... Initializing seed target: ${url}`, 'INFO');
  
  // This is a placeholder! We will replace this with our actual BFS queue loop soon.
  log('Crawler algorithm not yet implemented in memory.', 'WARN');
});

stopBtn.addEventListener('click', () => {
  crawlStatus.textContent = 'Status: Engine Offline';
  log('Abort signal broadcasted. Halting engine operations...', 'WARN');
});

// Print a confirmation message to the browser's developer console on boot
console.log('Nexus Engine UI script loaded successfully.');