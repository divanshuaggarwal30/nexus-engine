// 1. Get elements from the HTML page so we can use them in JavaScript
const seedUrlInput = document.getElementById('seed-url');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const crawlStatus = document.getElementById('crawl-status');
const logTerminal = document.getElementById('log-terminal');

// Track if this is our very first log message
let isFirstLog = true;

/**
 * Function to print messages into our terminal screen on the webpage.
 * message: The text you want to show.
 * type: The label for the message (like 'INFO', 'ERROR', etc.).
 */
function log(message, type = 'INFO') {
  // Clear the default HTML placeholder text when printing for the very first time
  if (isFirstLog) {
    logTerminal.textContent = '';
    isFirstLog = false;
  }

  // Get the current time (like 10:30:15 AM)
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] [${type}] ${message}\n`;

  // Add the new message to the terminal screen
  logTerminal.textContent += logLine;
  
  // Scroll down automatically so we always see the newest message
  logTerminal.scrollTop = logTerminal.scrollHeight;
}

// 2. Make our buttons do something when clicked
startBtn.addEventListener('click', () => {
  const url = seedUrlInput.value.trim();

  // Check if the user left the input box empty
  if (!url) {
    log('Please enter a valid target URL before starting the engine.', 'ERROR');
    return;
  }

  // Change the status text on the screen
  crawlStatus.textContent = 'Status: Engine Running...';
  log(`Booting crawler engine... Initializing seed target: ${url}`, 'INFO');
  
  // This is just a test message for now. The real crawler logic goes here later.
  log('Crawler algorithm not yet implemented in memory.', 'WARN');
});

stopBtn.addEventListener('click', () => {
  crawlStatus.textContent = 'Status: Engine Offline';
  log('Abort signal broadcasted. Halting engine operations...', 'WARN');
});

// Print a message in the browser's developer console to confirm the script is working
console.log('Nexus Engine UI script loaded successfully.');