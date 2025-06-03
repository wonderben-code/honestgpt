import axios from 'axios';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'search-service' },
});

// Trusted domains to prioritize in searches
const TRUSTED_DOMAINS = [
  // Government
  'site:*.gov',
  'site:*.gov.uk',
  'site:*.gov.ca',
  'site:*.gov.au',
  
  // Academic
  'site:*.edu',
  'site:*.ac.uk',
  'site:nature.com',
  'site:science.org',
  'site:sciencedirect.com',
  'site:pubmed.ncbi.nlm.nih.gov',
  'site:scholar.google.com',
  
  // International organizations
  'site:who.int',
  'site:un.org',
  'site:worldbank.org',
  
  // Reputable news
  'site:reuters.com',
  'site:apnews.com',
  'site:bbc.com',
  'site:npr.org',
  'site:pbs.org',
  
  // Fact-checking
  'site:snopes.com',
  'site:factcheck.org',
];

/**
 * Perform web search using Google Custom Search API
 * @param {string} query - Search query
 * @param {number} numResults - Number of results to return (max 10 per request)
 * @returns {Object} Search results with metadata
 */
export async function performWebSearch(query, numResults = 10) {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      throw new Error('Google Search API credentials not configured');
    }
    
    // First, try searching trusted domains
    const trustedResults = await searchTrustedDomains(query, apiKey, searchEngineId);
    
    // If we have enough trusted results, return them
    if (trustedResults.items && trustedResults.items.length >= numResults * 0.7) {
      logger.info('Sufficient trusted domain results found', { 
        query: query.substring(0, 50),
        count: trustedResults.items.length 
      });
      return processSearchResults(trustedResults, 'trusted');
    }
    
    // Otherwise, perform general search
    const generalResults = await performGeneralSearch(query, apiKey, searchEngineId, numResults);
    
    // Combine results, prioritizing trusted sources
    const combinedResults = combineResults(trustedResults, generalResults, numResults);
    
    return processSearchResults(combinedResults, 'mixed');
    
  } catch (error) {
    logger.error('Search error', { 
      error: error.message,
      query: query.substring(0, 50)
    });
    throw error;
  }
}

/**
 * Search only trusted domains
 */
async function searchTrustedDomains(query, apiKey, searchEngineId) {
  // Build query with trusted domain restrictions
  const domainQuery = `${query} (${TRUSTED_DOMAINS.slice(0, 5).join(' OR ')})`;
  
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: domainQuery,
        num: 10,
        safe: 'active',
        dateRestrict: 'd365', // Prefer results from last year
      },
      timeout: 10000,
    });
    
    return response.data;
  } catch (error) {
    logger.warn('Trusted domain search failed, falling back to general search', {
      error: error.message
    });
    return { items: [] };
  }
}

/**
 * Perform general web search
 */
async function performGeneralSearch(query, apiKey, searchEngineId, numResults) {
  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: query,
        num: numResults,
        safe: 'active',
      },
      timeout: 10000,
    });
    
    return response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      throw new Error('Search API rate limit exceeded. Please try again later.');
    }
    throw error;
  }
}

/**
 * Combine trusted and general results
 */
function combineResults(trustedResults, generalResults, maxResults) {
  const combined = {
    items: [],
    searchInformation: generalResults.searchInformation || {},
  };
  
  // Add all trusted results first
  if (trustedResults.items) {
    combined.items.push(...trustedResults.items);
  }
  
  // Add general results that aren't duplicates
  if (generalResults.items) {
    const trustedUrls = new Set(combined.items.map(item => item.link));
    const uniqueGeneral = generalResults.items.filter(item => !trustedUrls.has(item.link));
    combined.items.push(...uniqueGeneral);
  }
  
  // Limit to requested number
  combined.items = combined.items.slice(0, maxResults);
  
  return combined;
}

/**
 * Process and enrich search results
 */
function processSearchResults(searchData, sourceType) {
  if (!searchData.items || searchData.items.length === 0) {
    return {
      success: false,
      results: [],
      metadata: {
        totalResults: 0,
        searchTime: 0,
        sourceType,
      },
    };
  }
  
  // Process each result
  const processedResults = searchData.items.map((item, index) => {
    const domain = extractDomain(item.link);
    const quality = assessSourceQuality(domain);
    const sourceType = categorizeSource(domain);
    
    return {
      position: index + 1,
      title: item.title,
      link: item.link,
      displayLink: item.displayLink,
      snippet: item.snippet,
      domain: domain,
      quality: quality,
      sourceType: sourceType,
      metadata: {
        ogDescription: item.pagemap?.metatags?.[0]?.['og:description'],
        publishedDate: extractPublishDate(item),
        author: item.pagemap?.metatags?.[0]?.author,
      },
    };
  });
  
  return {
    success: true,
    results: processedResults,
    metadata: {
      totalResults: parseInt(searchData.searchInformation?.totalResults || 0),
      searchTime: parseFloat(searchData.searchInformation?.searchTime || 0),
      sourceType,
      query: searchData.queries?.request?.[0]?.searchTerms,
    },
  };
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Assess quality level of a source
 */
function assessSourceQuality(domain) {
  // Check government sources
  if (domain.endsWith('.gov') || domain.endsWith('.gov.uk')) {
    return 'high';
  }
  
  // Check academic sources
  if (domain.endsWith('.edu') || domain.endsWith('.ac.uk') || 
      ['nature.com', 'science.org', 'pubmed.ncbi.nlm.nih.gov'].includes(domain)) {
    return 'high';
  }
  
  // Check reputable news/orgs
  const reputableDomains = [
    'who.int', 'un.org', 'reuters.com', 'apnews.com', 'bbc.com',
    'npr.org', 'pbs.org', 'snopes.com', 'factcheck.org', 'britannica.com'
  ];
  if (reputableDomains.some(d => domain.includes(d))) {
    return 'high';
  }
  
  // Check medium quality sources
  const mediumDomains = [
    'wikipedia.org', 'nytimes.com', 'washingtonpost.com', 'theguardian.com',
    'economist.com', 'scientificamerican.com', 'technologyreview.com'
  ];
  if (mediumDomains.some(d => domain.includes(d))) {
    return 'medium';
  }
  
  // Everything else is limited quality
  return 'limited';
}

/**
 * Categorize the type of source
 */
function categorizeSource(domain) {
  if (domain.endsWith('.gov') || domain.endsWith('.gov.uk')) return 'government';
  if (domain.endsWith('.edu') || domain.endsWith('.ac.uk')) return 'academic';
  if (['who.int', 'un.org', 'worldbank.org', 'imf.org'].some(d => domain.includes(d))) {
    return 'international_org';
  }
  if (['nature.com', 'science.org', 'pubmed.ncbi.nlm.nih.gov', 'sciencedirect.com'].some(d => domain.includes(d))) {
    return 'scientific_journal';
  }
  if (['reuters.com', 'apnews.com', 'bbc.com', 'npr.org'].some(d => domain.includes(d))) {
    return 'news_agency';
  }
  if (['snopes.com', 'factcheck.org', 'politifact.com'].some(d => domain.includes(d))) {
    return 'fact_checker';
  }
  if (['wikipedia.org', 'britannica.com'].some(d => domain.includes(d))) {
    return 'encyclopedia';
  }
  if (domain.includes('blog') || domain.includes('medium.com') || domain.includes('substack.com')) {
    return 'blog';
  }
  
  return 'website';
}

/**
 * Extract publish date from search result
 */
function extractPublishDate(item) {
  // Try multiple sources for date
  const sources = [
    item.pagemap?.metatags?.[0]?.['article:published_time'],
    item.pagemap?.metatags?.[0]?.['published_time'],
    item.pagemap?.metatags?.[0]?.['publication_date'],
    item.pagemap?.metatags?.[0]?.['date'],
  ];
  
  for (const dateStr of sources) {
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date)) {
        return date.toISOString();
      }
    }
  }
  
  // Try to extract from snippet
  if (item.snippet) {
    const dateMatch = item.snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}|\b\d{4}-\d{2}-\d{2}\b/i);
    if (dateMatch) {
      const date = new Date(dateMatch[0]);
      if (!isNaN(date)) {
        return date.toISOString();
      }
    }
  }
  
  return null;
}

/**
 * Search for specific types of content
 */
export async function searchAcademicSources(query) {
  const academicQuery = `${query} site:scholar.google.com OR site:pubmed.ncbi.nlm.nih.gov OR site:arxiv.org OR filetype:pdf`;
  return performWebSearch(academicQuery, 10);
}

export async function searchGovernmentSources(query) {
  const govQuery = `${query} site:*.gov OR site:*.gov.uk OR site:who.int`;
  return performWebSearch(govQuery, 10);
}

export async function searchFactCheckers(query) {
  const factCheckQuery = `${query} site:snopes.com OR site:factcheck.org OR site:politifact.com`;
  return performWebSearch(factCheckQuery, 5);
}