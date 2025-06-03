import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'confidence-service' },
});

// Domain quality scores (0-100)
const DOMAIN_QUALITY_SCORES = {
  // Government sources
  '.gov': 95,
  '.gov.uk': 95,
  '.gov.ca': 95,
  '.gov.au': 95,
  
  // Academic sources
  '.edu': 90,
  '.ac.uk': 90,
  'nature.com': 95,
  'science.org': 95,
  'sciencedirect.com': 90,
  'pubmed.ncbi.nlm.nih.gov': 95,
  'arxiv.org': 85,
  'scholar.google.com': 85,
  
  // International organizations
  'who.int': 95,
  'un.org': 90,
  'worldbank.org': 90,
  'imf.org': 90,
  
  // Reputable news sources
  'reuters.com': 85,
  'apnews.com': 85,
  'bbc.com': 80,
  'bbc.co.uk': 80,
  'npr.org': 80,
  'pbs.org': 80,
  'economist.com': 80,
  'ft.com': 80,
  'wsj.com': 75,
  'nytimes.com': 75,
  'washingtonpost.com': 75,
  'theguardian.com': 75,
  
  // Fact-checking sites
  'snopes.com': 85,
  'factcheck.org': 85,
  'politifact.com': 80,
  
  // Reference sources
  'wikipedia.org': 70,
  'britannica.com': 85,
  
  // Tech/Science publications
  'arstechnica.com': 70,
  'scientificamerican.com': 80,
  'technologyreview.com': 75,
  'wired.com': 65,
  
  // General/Unknown sources
  'medium.com': 45,
  'substack.com': 50,
  'reddit.com': 30,
  'quora.com': 35,
  'youtube.com': 40,
  'twitter.com': 25,
  'facebook.com': 25,
};

// Topic stability scores - how quickly information changes
const TOPIC_STABILITY = {
  // Very stable (rarely changes)
  'mathematics': 0.95,
  'history': 0.90,
  'geography': 0.85,
  'basic_science': 0.85,
  
  // Moderately stable
  'medicine': 0.70,
  'technology': 0.60,
  'law': 0.65,
  'economics': 0.60,
  
  // Rapidly changing
  'current_events': 0.30,
  'politics': 0.40,
  'cryptocurrency': 0.35,
  'stock_market': 0.30,
  'ai_ml': 0.50,
};

// Uncertainty indicators in text
const UNCERTAINTY_PHRASES = [
  'may', 'might', 'could', 'possibly', 'potentially', 'preliminary',
  'suggests', 'indicates', 'appears', 'seems', 'likely', 'unlikely',
  'estimated', 'approximately', 'roughly', 'around', 'about',
  'controversial', 'debated', 'disputed', 'unclear', 'uncertain',
  'no consensus', 'mixed results', 'conflicting', 'varies',
  'further research needed', 'more studies required', 'limited data',
];

/**
 * Calculate overall confidence score based on search results
 * @param {Array} searchResults - Array of search result objects
 * @param {string} question - The user's question
 * @param {string} topic - Detected topic category
 * @returns {Object} Confidence score and breakdown
 */
export async function calculateConfidence(searchResults, question, topic = 'general') {
  try {
    // 1. Calculate source quality score (30% weight)
    const sourceQuality = calculateSourceQuality(searchResults);
    
    // 2. Calculate source agreement/consensus (25% weight)
    const sourceAgreement = calculateSourceAgreement(searchResults);
    
    // 3. Calculate information recency score (25% weight)
    const recencyScore = calculateRecencyScore(searchResults, topic);
    
    // 4. Calculate certainty from language (20% weight)
    const certaintyScore = calculateCertaintyScore(searchResults);
    
    // Calculate weighted average
    const overallConfidence = Math.round(
      sourceQuality.score * 0.30 +
      sourceAgreement.score * 0.25 +
      recencyScore.score * 0.25 +
      certaintyScore.score * 0.20
    );
    
    // Determine confidence level
    let level = 'low';
    if (overallConfidence >= 80) level = 'high';
    else if (overallConfidence >= 60) level = 'medium';
    
    // Compile detailed breakdown
    const breakdown = {
      overall: overallConfidence,
      level: level,
      factors: {
        sourceQuality: {
          score: sourceQuality.score,
          weight: 30,
          details: sourceQuality.details,
        },
        sourceAgreement: {
          score: sourceAgreement.score,
          weight: 25,
          details: sourceAgreement.details,
        },
        recencyScore: {
          score: recencyScore.score,
          weight: 25,
          details: recencyScore.details,
        },
        certaintyScore: {
          score: certaintyScore.score,
          weight: 20,
          details: certaintyScore.details,
        },
      },
    };
    
    logger.info('Confidence calculated', { 
      question: question.substring(0, 50),
      confidence: overallConfidence,
      level,
    });
    
    return breakdown;
  } catch (error) {
    logger.error('Error calculating confidence', { error: error.message });
    // Return low confidence on error
    return {
      overall: 25,
      level: 'low',
      factors: {
        error: 'Unable to calculate confidence accurately',
      },
    };
  }
}

/**
 * Calculate source quality score based on domain reputation
 */
function calculateSourceQuality(searchResults) {
  if (!searchResults || searchResults.length === 0) {
    return { score: 0, details: 'No sources available' };
  }
  
  const scores = searchResults.map(result => {
    const url = result.link || result.url || '';
    const domain = extractDomain(url);
    
    // Check exact domain match first
    if (DOMAIN_QUALITY_SCORES[domain]) {
      return DOMAIN_QUALITY_SCORES[domain];
    }
    
    // Check partial domain matches
    for (const [key, score] of Object.entries(DOMAIN_QUALITY_SCORES)) {
      if (domain.includes(key) || key.includes(domain)) {
        return score;
      }
    }
    
    // Default score for unknown domains
    return 50;
  });
  
  // Calculate average, giving more weight to higher quality sources
  const weightedAverage = scores.reduce((acc, score, index) => {
    // Give more weight to top results
    const weight = 1 / (index + 1);
    return acc + (score * weight);
  }, 0);
  
  const totalWeight = scores.reduce((acc, _, index) => acc + (1 / (index + 1)), 0);
  const finalScore = Math.round(weightedAverage / totalWeight);
  
  return {
    score: finalScore,
    details: `Analyzed ${scores.length} sources. Top domains included.`,
  };
}

/**
 * Calculate how well sources agree with each other
 */
function calculateSourceAgreement(searchResults) {
  if (!searchResults || searchResults.length < 2) {
    return { score: 50, details: 'Insufficient sources for consensus analysis' };
  }
  
  // Extract key claims/facts from snippets
  const snippets = searchResults.map(r => (r.snippet || '').toLowerCase());
  
  // Simple agreement check - look for contradictory terms
  const contradictoryPairs = [
    ['yes', 'no'],
    ['true', 'false'],
    ['safe', 'dangerous'],
    ['effective', 'ineffective'],
    ['proven', 'unproven'],
    ['confirmed', 'debunked'],
    ['increase', 'decrease'],
    ['positive', 'negative'],
  ];
  
  let contradictions = 0;
  let agreements = 0;
  
  for (let i = 0; i < snippets.length - 1; i++) {
    for (let j = i + 1; j < snippets.length; j++) {
      const snippet1 = snippets[i];
      const snippet2 = snippets[j];
      
      // Check for contradictions
      for (const [term1, term2] of contradictoryPairs) {
        if ((snippet1.includes(term1) && snippet2.includes(term2)) ||
            (snippet1.includes(term2) && snippet2.includes(term1))) {
          contradictions++;
        }
      }
      
      // Check for agreement (similar key terms)
      const words1 = snippet1.split(/\s+/);
      const words2 = snippet2.split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w) && w.length > 4);
      if (commonWords.length > 5) {
        agreements++;
      }
    }
  }
  
  // Calculate agreement score
  const totalComparisons = (snippets.length * (snippets.length - 1)) / 2;
  const agreementRatio = agreements / totalComparisons;
  const contradictionRatio = contradictions / totalComparisons;
  
  const score = Math.round(Math.max(0, Math.min(100, 
    50 + (agreementRatio * 100) - (contradictionRatio * 200)
  )));
  
  return {
    score,
    details: contradictions > 0 
      ? `Found ${contradictions} potential contradictions among sources`
      : 'Sources show general agreement',
  };
}

/**
 * Calculate recency score based on publication dates and topic volatility
 */
function calculateRecencyScore(searchResults, topic) {
  const now = new Date();
  const scores = [];
  
  for (const result of searchResults) {
    let publishDate = null;
    
    // Try to extract date from snippet or metadata
    if (result.pagemap?.metatags?.[0]?.['article:published_time']) {
      publishDate = new Date(result.pagemap.metatags[0]['article:published_time']);
    } else if (result.snippet) {
      // Look for date patterns in snippet
      const dateMatch = result.snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2},?\s+\d{4}|\b\d{4}-\d{2}-\d{2}\b/i);
      if (dateMatch) {
        publishDate = new Date(dateMatch[0]);
      }
    }
    
    if (publishDate && !isNaN(publishDate)) {
      const ageInDays = (now - publishDate) / (1000 * 60 * 60 * 24);
      
      // Score based on age and topic stability
      const topicStability = TOPIC_STABILITY[topic] || 0.5;
      let score = 100;
      
      if (topicStability > 0.8) {
        // Very stable topics - older sources are fine
        score = ageInDays < 3650 ? 90 : 70; // 10 years
      } else if (topicStability > 0.6) {
        // Moderately stable topics
        score = Math.max(0, 100 - (ageInDays / 10)); // Decay over ~3 years
      } else {
        // Rapidly changing topics - need very recent sources
        score = Math.max(0, 100 - (ageInDays / 3)); // Decay over ~3 months
      }
      
      scores.push(score);
    }
  }
  
  if (scores.length === 0) {
    return { score: 60, details: 'Unable to determine source dates' };
  }
  
  const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  return {
    score: averageScore,
    details: `Based on ${scores.length} dated sources and ${topic || 'general'} topic volatility`,
  };
}

/**
 * Calculate certainty based on language used in sources
 */
function calculateCertaintyScore(searchResults) {
  if (!searchResults || searchResults.length === 0) {
    return { score: 50, details: 'No sources to analyze' };
  }
  
  let totalWords = 0;
  let uncertaintyCount = 0;
  
  for (const result of searchResults) {
    const text = (result.snippet || '').toLowerCase();
    const words = text.split(/\s+/);
    totalWords += words.length;
    
    // Count uncertainty indicators
    for (const phrase of UNCERTAINTY_PHRASES) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        uncertaintyCount += matches.length;
      }
    }
  }
  
  if (totalWords === 0) {
    return { score: 50, details: 'No text to analyze' };
  }
  
  // Calculate uncertainty ratio
  const uncertaintyRatio = uncertaintyCount / totalWords;
  
  // Convert to certainty score (inverse of uncertainty)
  // Typical good sources have 1-3% uncertainty words
  const score = Math.round(Math.max(0, Math.min(100, 
    100 - (uncertaintyRatio * 1000)
  )));
  
  return {
    score,
    details: uncertaintyCount > 0 
      ? `Found ${uncertaintyCount} uncertainty indicators in text`
      : 'Sources use confident language',
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
 * Detect topic category from question
 */
export function detectTopic(question) {
  const q = question.toLowerCase();
  
  if (q.match(/\b(math|calculus|algebra|geometry|equation)\b/)) return 'mathematics';
  if (q.match(/\b(history|historical|ancient|war|revolution)\b/)) return 'history';
  if (q.match(/\b(geography|country|capital|continent|ocean)\b/)) return 'geography';
  if (q.match(/\b(physics|chemistry|biology|science)\b/)) return 'basic_science';
  if (q.match(/\b(medicine|health|disease|treatment|diagnosis)\b/)) return 'medicine';
  if (q.match(/\b(technology|software|computer|ai|machine learning)\b/)) return 'technology';
  if (q.match(/\b(law|legal|court|regulation|statute)\b/)) return 'law';
  if (q.match(/\b(economy|economics|inflation|gdp|market)\b/)) return 'economics';
  if (q.match(/\b(news|today|yesterday|current|latest)\b/)) return 'current_events';
  if (q.match(/\b(politics|election|government|policy)\b/)) return 'politics';
  if (q.match(/\b(crypto|bitcoin|blockchain|defi)\b/)) return 'cryptocurrency';
  if (q.match(/\b(stock|trading|investment|portfolio)\b/)) return 'stock_market';
  if (q.match(/\b(artificial intelligence|ml|neural|deep learning)\b/)) return 'ai_ml';
  
  return 'general';
}