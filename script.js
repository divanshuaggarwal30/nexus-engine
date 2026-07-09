// 1. Cache DOM Elements
const seedUrlInput = document.getElementById("seed-url");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const crawlStatus = document.getElementById("crawl-status");
const logTerminal = document.getElementById("log-terminal");

// 2. Engine Memory State (Data Structures)
let isFirstLog = true;
let isCrawling = false;
let abortSignal = false;
const visitedSet = new Set(); // Tracks crawled URLs to prevent infinite cyclic loops
const crawlQueue = []; // FIFO Queue for Breadth-First Search traversal

/**
 * Prints a timestamped message to the dashboard terminal window.
 */
function log(message, type = "INFO") {
  if (isFirstLog) {
    logTerminal.textContent = "";
    isFirstLog = false;
  }
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] [${type}] ${message}\n`;
  logTerminal.textContent += logLine;
  logTerminal.scrollTop = logTerminal.scrollHeight;
}

/**
 * Client-Side DOM Parser: Converts raw HTML text into clean titles, text snippets, and hyperlinks.
 * @param {string} htmlString - Raw HTML payload returned from fetch().
 * @param {string} currentUrl - The base URL used to resolve relative links.
 */
function parseHtmlPayload(htmlString, currentUrl) {
  // Use browser's native DOMParser (Zero external dependencies needed!)
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, "text/html");

  // Extract page title
  const title = doc.querySelector("title")?.innerText.trim() || "Untitled Node";

  // Extract clean visible text (strip unnecessary whitespace)
  const rawText = doc.body?.innerText.replace(/\s+/g, " ").trim() || "";

  // Extract and resolve hyperlinks (<a href="...">)
  const discoveredLinks = new Set();
  const anchorTags = doc.querySelectorAll("a[href]");

  anchorTags.forEach((anchor) => {
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

    try {
      // Resolve relative paths (like "./sandbox/page-beta.html") against the current URL location
      const resolvedUrl = new URL(href, window.location.href).pathname;
      discoveredLinks.add(resolvedUrl);
    } catch (err) {
      // Ignore malformed links
    }
  });

  return {
    title,
    rawText: rawText.slice(0, 150), // Snippet for terminal display
    links: Array.from(discoveredLinks),
  };
}

/**
 * Asynchronous Breadth-First Search (BFS) Crawling Loop
 */
async function startCrawl(seedUrl) {
  isCrawling = true;
  abortSignal = false;
  visitedSet.clear();
  crawlQueue.length = 0; // Empty the queue

  // 1. Initialize BFS Queue with Seed URL
  crawlQueue.push(seedUrl);
  crawlStatus.textContent = "Status: Engine Running (BFS Traversal Active)...";
  log(`Initialized BFS Queue. Seed Target: ${seedUrl}`, "INFO");
  
  // 2. Main Traversal Loop
  while (crawlQueue.length > 0 && !abortSignal) {
    // Dequeue the next URL from the front of the line (FIFO)
    const currentUrl = crawlQueue.shift();

    // Cyclic Loop Prevention: If already visited, skip immediately
    if (visitedSet.has(currentUrl)) {
      log(
        `Cyclic link detected: ${currentUrl} (Already crawled. Discarding!)`,
        "WARN",
      );
      continue;
    }

    // Mark as visited
    visitedSet.add(currentUrl);
    log(`Fetching Node (${visitedSet.size}): ${currentUrl}`, "INFO");

    try {
      // Fetch raw HTML payload from our sandbox
      const response = await fetch(currentUrl);
      if (!response.ok) throw new Error(`HTTP Status ${response.status}`);

      const htmlText = await response.text();

      // Execute our manual DOM Parser
      const { title, rawText, links } = parseHtmlPayload(htmlText, currentUrl);

      log(
        `Parsed "${title}" | Found ${links.length} outgoing links.`,
        "SUCCESS",
      );
      log(`Text Snippet: "${rawText}..."`, "INFO");

      // Enqueue newly discovered links that haven't been visited yet
      links.forEach((link) => {
        if (!visitedSet.has(link) && !crawlQueue.includes(link)) {
          crawlQueue.push(link);
          log(`Enqueued new target: ${link}`, "INFO");
        }
      });
    } catch (error) {
      log(`Failed to crawl ${currentUrl}: ${error.message}`, "ERROR");
    }

    // Yield execution for 800ms so we can watch the terminal animate visually!
    await new Promise((resolve) => setTimeout(resolve, 800));
  }

  isCrawling = false;
  crawlStatus.textContent = abortSignal
    ? "Status: Engine Aborted"
    : "Status: Crawl Completed";
  log(
    `Engine standby. Total unique nodes indexed in memory: ${visitedSet.size}`,
    "SUCCESS",
  );
}

// 3. UI Event Listeners
startBtn.addEventListener("click", () => {
  if (isCrawling) {
    log("Engine is already actively crawling an index job.", "WARN");
    return;
  }

  // Default to our sandbox Alpha node if the user leaves input blank
  const inputUrl = seedUrlInput.value.trim() || "./sandbox/page-alpha.html";
  startCrawl(inputUrl);
});

stopBtn.addEventListener("click", () => {
  if (!isCrawling) return;
  abortSignal = true;
  log("Abort signal broadcasted. Halting queue traversal...", "WARN");
});

log("Nexus Engine algorithm script loaded. Ready for sandbox traversal.");
