const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const url = require('url');

// Set to keep track of visited URLs to avoid duplicates
const visitedUrls = new Set();
// Queue of URLs to process
let urlQueue = [];
// Base URL of the website to scrape
let baseUrl = '';
// Output directory for saving scraped content
const outputDir = path.join(__dirname, 'scraped_content');

/**
 * Initialize the scraper with a starting URL
 * @param {string} startUrl - The URL to start scraping from
 */
async function initScraper(startUrl) {
  // Parse the base URL to ensure we only scrape within the same domain
  const parsedUrl = new URL(startUrl);
  baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}`;
  
  console.log(`Starting to scrape website: ${baseUrl}`);
  console.log(`Output directory: ${outputDir}`);
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Add the starting URL to the queue
  urlQueue.push(startUrl);
  
  // Start the scraping process
  await processQueue();
  
  console.log('Scraping completed!');
}

/**
 * Process the URL queue until it's empty
 */
async function processQueue() {
  while (urlQueue.length > 0) {
    const currentUrl = urlQueue.shift();
    
    // Skip if already visited
    if (visitedUrls.has(currentUrl)) {
      continue;
    }
    
    console.log(`Processing: ${currentUrl}`);
    
    try {
      // Mark as visited before processing to avoid race conditions
      visitedUrls.add(currentUrl);
      
      // Scrape the page
      await scrapePage(currentUrl);
      
      // Throttle requests to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error processing ${currentUrl}:`, error.message);
    }
  }
}

/**
 * Scrape a single page, extract content and find links
 * @param {string} pageUrl - The URL of the page to scrape
 */
async function scrapePage(pageUrl) {
  try {
    // Fetch the page content
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      maxRedirects: 0,  // Don't follow redirects automatically
      validateStatus: status => status >= 200 && status < 400  // Accept only successful responses
    });
    
    // Check if we were redirected
    const finalUrl = response.request.res.responseUrl || pageUrl;
    
    // If we were redirected to a different URL, mark it as visited and skip processing
    if (finalUrl !== pageUrl) {
      console.log(`Skipping redirect from ${pageUrl} to ${finalUrl}`);
      visitedUrls.add(finalUrl);
      return;
    }
    
    // Load the HTML into cheerio
    const $ = cheerio.load(response.data);
    
    // Extract page title
    const pageTitle = $('title').text().trim() || 'Untitled';
    
    // Extract only headings and paragraph text content
    let pageContent = '';
    
    // Extract headings (h1-h6)
    $('h1, h2, h3, h4, h5, h6').each((_, element) => {
      const headingText = $(element).text().trim();
      if (headingText) {
        pageContent += `${headingText}\n\n`;
      }
    });
    
    // Extract paragraph text
    $('p').each((_, element) => {
      const paragraphText = $(element).text().trim();
      if (paragraphText) {
        pageContent += `${paragraphText}\n\n`;
      }
    });
    
    // Save the content to a file
    saveContent(pageUrl, pageTitle, pageContent);
    
    // Find all links on the page
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href) {
        const fullUrl = resolveUrl(pageUrl, href);
        
if (!fullUrl) {
  return;
}
        
        // Skip URLs that redirect to home page
        const parsedFullUrl = new URL(fullUrl);
        const parsedBaseUrl = new URL(baseUrl);
        
        // Check if it's the home page (path is "/" or empty)
        const isHomePage = parsedFullUrl.pathname === "/" || parsedFullUrl.pathname === "";
        
        // Check if it's the same page (same URL without hash)
        const isSamePage = fullUrl.split('#')[0] === pageUrl.split('#')[0];
        
        // Check if it's a third-party website (different domain)
        const isThirdParty = parsedFullUrl.hostname !== parsedBaseUrl.hostname;
        
        // Only add URLs that:
        // 1. Are from the same domain
        // 2. Haven't been visited
        // 3. Are not the home page
        // 4. Are not the same page
        // 5. Are not third-party websites
        if (fullUrl.startsWith(baseUrl) && 
            !visitedUrls.has(fullUrl) && 
            !isHomePage && 
            !isSamePage && 
            !isThirdParty) {
          urlQueue.push(fullUrl);
        }
      }
    });
  } catch (error) {
    console.error(`Failed to scrape ${pageUrl}:`, error.message);
  }
}

/**
 * Resolve relative URLs to absolute URLs
 * @param {string} base - The base URL
 * @param {string} relative - The relative URL
 * @returns {string|null} - The resolved absolute URL or null if invalid
 */
function resolveUrl(base, relative) {
  try {
    // Skip fragment-only URLs, mailto links, tel links, etc.
    if (!relative || 
        relative.startsWith('#') || 
        relative.startsWith('mailto:') || 
        relative.startsWith('tel:') ||
        relative.startsWith('javascript:')) {
      return null;
    }
    
    // Resolve the URL
    const resolvedUrl = new URL(relative, base).href;
    
    // Remove hash fragments
    return resolvedUrl.split('#')[0];
  } catch (error) {
    console.error(`Error resolving URL ${relative} from ${base}:`, error.message);
    return null;
  }
}

/**
 * Save the scraped content to a file
 * @param {string} url - The URL of the page
 * @param {string} title - The title of the page
 * @param {string} content - The content of the page
 */
function saveContent(url, title, content) {
  try {
    // Create a sanitized filename from the URL
    const parsedUrl = new URL(url);
    let filename = parsedUrl.pathname.replace(/\//g, '_');
    
    if (filename === '' || filename === '_') {
      filename = 'index';
    }
    
    filename = `${filename}.txt`;
    const filePath = path.join(outputDir, filename);
    
    // Prepare the content with metadata
    const fileContent = `URL: ${url}\nTitle: ${title}\n\n${content}`;
    
    // Write to file
    fs.writeFileSync(filePath, fileContent);
    console.log(`Saved content from ${url} to ${filePath}`);
  } catch (error) {
    console.error(`Error saving content from ${url}:`, error.message);
  }
}

// Example usage
// Replace 'https://example.com' with the website you want to scrape
if (require.main === module) {
  const targetWebsite = process.argv[2] || 'https://helpdesk.bitrix24.com/';
  initScraper(targetWebsite)
    .catch(error => console.error('Scraping failed:', error));
}

// Export functions for use in other modules
module.exports = {
  initScraper
};