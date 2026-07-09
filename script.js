// 1. Cache DOM Elements
const seedUrlInput = document.getElementById('seed-url');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const crawlStatus = document.getElementById('crawl-status');
const logTerminal = document.getElementById('log-terminal');

// 2. Engine Memory State & Constants
let isFirstLog = true;
let isCrawling = false;
let abortSignal = false;
const visitedSet = new Set(); // Tracks crawled URLs to prevent infinite cyclic loops
const crawlQueue = [];        // FIFO Queue for Breadth-First Search traversal

// Common English grammar words to ignore during statistical indexing
const STOP_WORDS = new Set([
  'the', 'of', 'to', 'and', 'a', 'in', 'is', 'it', 'you', 'that', 'he', 'was', 'for', 
  'on', 'are', 'with', 'as', 'i', 'his', 'they', 'be', 'at', 'one', 'have', 'this', 
  'from', 'or', 'had', 'by', 'not', 'word', 'but', 'what', 'some', 'we', 'can', 'out', 
  'other', 'were', 'all', 'there', 'when', 'up', 'use', 'your', 'how', 'said', 'an', 
  'each', 'she', 'which', 'do', 'their', 'time', 'if', 'will', 'way', 'about', 'many', 
  'then', 'them', 'would', 'like', 'so', 'these', 'her', 'long', 'make', 'thing', 
  'see', 'him', 'two', 'has', 'look', 'more', 'day', 'could', 'go', 'come', 'did', 
  'no', 'most', 'people', 'my', 'over', 'know', 'water', 'than', 'call', 'first', 
  'who', 'may', 'down', 'side', 'been', 'now', 'find', 'any', 'new', 'work', 'part', 
  'take', 'get', 'place', 'made', 'live', 'where', 'after', 'back', 'little', 'only', 
  'round', 'man', 'year', 'came', 'show', 'every', 'good', 'me', 'give', 'our', 'under', 
  'name', 'very', 'through', 'just', 'form', 'sentence', 'great', 'think', 'say', 'help', 
  'low', 'line', 'differ', 'turn', 'cause', 'much', 'mean', 'before', 'move', 'right', 
  'old', 'too', 'same', 'tell', 'does', 'set', 'three', 'want', 'air', 'well', 'also', 'must'
]);

/**
 * Prints a timestamped message to the dashboard terminal window.
 */
function log(message, type = 'INFO') {
  if (isFirstLog) {
    logTerminal.textContent = '';
    isFirstLog = false;
  }
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] [${type}] ${message}\n`;
  logTerminal.textContent += logLine;
  logTerminal.scrollTop = logTerminal.scrollHeight;
}

/**
 * Algorithmic Text Tokenizer & Keyword Density Calculator
 * @param {string} rawText - The uncleaned text extracted from the document body.
 * @returns {Array} Array of top keyword objects sorted by density percentage.
 */
function computeKeywordDensity(rawText) {
  // 1. Lowercase and strip all punctuation/symbols using regex
  const cleanText = rawText.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  
  // 2. Tokenize by splitting on whitespace and filter out stop words or tiny 1-2 letter words
  const words = cleanText.split(/\s+/).filter(word => {
    return word.length > 2 && !STOP_WORDS.has(word);
  });

  const totalWords = words.length || 1;
  const frequencyMap = {};

  // 3. Calculate Term Frequency (TF)
  words.forEach(word => {
    frequencyMap[word] = (frequencyMap[word] || 0) + 1;
  });

  // 4. Convert counts to density percentages and sort highest to lowest
  const sortedKeywords = Object.entries(frequencyMap)
    .map(([word, count]) => {
      const density = ((count / totalWords) * 100).toFixed(1);
      return { word, count, density: Number(density) };
    })
    .sort((a, b) => b.count - a.count);

  return sortedKeywords;
}

/**
 * Client-Side DOM Parser: Converts raw HTML text into clean titles, text, and hyperlinks.
 */
function parseHtmlPayload(htmlString, currentUrl) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const title = doc.querySelector('title')?.innerText.trim() || 'Untitled Node';
  const rawText = doc.body?.innerText.replace(/\s+/g, ' ').trim() || '';

  const discoveredLinks = new Set();
  const anchorTags = doc.querySelectorAll('a[href]');

  anchorTags.forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return;

    try {
      const resolvedUrl = new URL(href, window.location.href).pathname;
      discoveredLinks.add(resolvedUrl);
    } catch (err) {
      // Ignore malformed links
    }
  });

  return {
    title,
    rawText,
    links: Array.from(discoveredLinks)
  };
}

/**
 * Asynchronous Breadth-First Search (BFS) Crawling Loop
 */
async function startCrawl(seedUrl) {
  isCrawling = true;
  abortSignal = false;
  visitedSet.clear();
  crawlQueue.length = 0;

  crawlQueue.push(seedUrl);
  crawlStatus.textContent = 'Status: Engine Running (BFS Traversal Active)...';
  log(`Initialized BFS Queue. Seed Target: ${seedUrl}`, 'INFO');

  while (crawlQueue.length > 0 && !abortSignal) {
    const currentUrl = crawlQueue.shift();

    if (visitedSet.has(currentUrl)) {
      log(`Cyclic link detected: ${currentUrl} (Already crawled. Discarding!)`, 'WARN');
      continue;
    }

    visitedSet.add(currentUrl);
    log(`Fetching Node (${visitedSet.size}): ${currentUrl}`, 'INFO');

    try {
      const response = await fetch(currentUrl);
      if (!response.ok) throw new Error(`HTTP Status ${response.status}`);
      
      const htmlText = await response.text();
      const { title, rawText, links } = parseHtmlPayload(htmlText, currentUrl);

      // Execute algorithmic text tokenization
      const keywordMetrics = computeKeywordDensity(rawText);
      const topKeywords = keywordMetrics.slice(0, 4); // Grab top 4 for terminal display

      log(`Parsed "${title}" | Found ${links.length} outgoing links.`, 'SUCCESS');
      
      // Format our keyword density weights for terminal readout
      const keywordString = topKeywords.map(k => `${k.word} (${k.density}%)`).join(', ');
      log(`Top Keyword Density: [ ${keywordString} ]`, 'INFO');

      links.forEach((link) => {
        if (!visitedSet.has(link) && !crawlQueue.includes(link)) {
          crawlQueue.push(link);
          log(`Enqueued new target: ${link}`, 'INFO');
        }
      });

    } catch (error) {
      log(`Failed to crawl ${currentUrl}: ${error.message}`, 'ERROR');
    }

    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  isCrawling = false;
  crawlStatus.textContent = abortSignal ? 'Status: Engine Aborted' : 'Status: Crawl Completed';
  log(`Engine standby. Total unique nodes indexed in memory: ${visitedSet.size}`, 'SUCCESS');
}

// 3. UI Event Listeners
startBtn.addEventListener('click', () => {
  if (isCrawling) {
    log('Engine is already actively crawling an index job.', 'WARN');
    return;
  }
  
  const inputUrl = seedUrlInput.value.trim() || './sandbox/page-alpha.html';
  startCrawl(inputUrl);
});

stopBtn.addEventListener('click', () => {
  if (!isCrawling) return;
  abortSignal = true;
  log('Abort signal broadcasted. Halting queue traversal...', 'WARN');
});

log('Nexus Engine algorithm script loaded. Ready for sandbox traversal.');