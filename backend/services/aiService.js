import OpenAI from 'openai';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'ai-service' },
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an AI response based on search results and confidence analysis
 * @param {string} question - User's question
 * @param {Array} searchResults - Processed search results
 * @param {Object} confidenceBreakdown - Confidence analysis
 * @param {string} conversationContext - Previous conversation context
 * @returns {Object} AI response with metadata
 */
export async function generateAIResponse(question, searchResults, confidenceBreakdown, conversationContext = '') {
  try {
    // Build the system prompt
    const systemPrompt = buildSystemPrompt(confidenceBreakdown);
    
    // Build the user prompt with search results
    const userPrompt = buildUserPrompt(question, searchResults, confidenceBreakdown);
    
    // Add conversation context if available
    const messages = [
      { role: 'system', content: systemPrompt },
    ];
    
    if (conversationContext) {
      messages.push({ role: 'system', content: `Previous conversation context: ${conversationContext}` });
    }
    
    messages.push({ role: 'user', content: userPrompt });
    
    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1500,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
    });
    
    const response = completion.choices[0].message.content;
    
    // Parse the response to extract structured data
    const structuredResponse = parseAIResponse(response, searchResults, confidenceBreakdown);
    
    // Log token usage for cost tracking
    logger.info('AI response generated', {
      question: question.substring(0, 50),
      tokens: completion.usage,
      confidence: confidenceBreakdown.overall,
    });
    
    return structuredResponse;
    
  } catch (error) {
    logger.error('AI generation error', { error: error.message });
    
    // Fallback response
    return {
      success: false,
      error: 'Unable to generate response',
      fallbackResponse: generateFallbackResponse(question, confidenceBreakdown),
    };
  }
}

/**
 * Build system prompt based on confidence level
 */
function buildSystemPrompt(confidenceBreakdown) {
  const confidenceLevel = confidenceBreakdown.level;
  const confidenceScore = confidenceBreakdown.overall;
  
  let personalityPrompt = '';
  
  if (confidenceLevel === 'high') {
    personalityPrompt = `You have HIGH confidence (${confidenceScore}%) in the available information. 
    Be clear and authoritative while still acknowledging any minor uncertainties.
    Start with a direct answer, then provide supporting details.`;
  } else if (confidenceLevel === 'medium') {
    personalityPrompt = `You have MEDIUM confidence (${confidenceScore}%) in the available information.
    Be balanced in your response - provide the best available answer while clearly noting uncertainties.
    Use phrases like "based on available evidence", "current understanding suggests", "appears to be".`;
  } else {
    personalityPrompt = `You have LOW confidence (${confidenceScore}%) in the available information.
    Be very transparent about the limitations and uncertainties.
    Start by acknowledging the difficulty in providing a definitive answer.
    Use phrases like "I cannot say with confidence", "the evidence is limited", "there is significant uncertainty".`;
  }
  
  return `You are honestGPT, an AI assistant that prioritizes transparency and accuracy above all else.
  
${personalityPrompt}

Your response must include:
1. A direct answer (even if it's "I don't know with confidence")
2. Key supporting points from the search results
3. Important caveats or limitations
4. Any areas of controversy or disagreement among sources

CRITICAL RULES:
- Never claim certainty when sources disagree
- Always mention if information might be outdated
- Acknowledge when you cannot find reliable information
- Be concise but thorough
- Cite specific sources when making claims
- If sources strongly contradict each other, explain both viewpoints

Format your response in clear paragraphs without using bullet points or lists.`;
}

/**
 * Build user prompt with search results
 */
function buildUserPrompt(question, searchResults, confidenceBreakdown) {
  // Prepare search results summary
  const sourceSummary = searchResults.slice(0, 8).map((result, index) => {
    return `Source ${index + 1} (${result.quality} quality, ${result.sourceType}):
Title: ${result.title}
Domain: ${result.domain}
Snippet: ${result.snippet}
${result.metadata.publishedDate ? `Published: ${new Date(result.metadata.publishedDate).toLocaleDateString()}` : ''}`;
  }).join('\n\n');
  
  // Prepare confidence context
  const confidenceContext = `
Confidence Analysis:
- Overall Confidence: ${confidenceBreakdown.overall}% (${confidenceBreakdown.level})
- Source Quality: ${confidenceBreakdown.factors.sourceQuality.score}% - ${confidenceBreakdown.factors.sourceQuality.details}
- Source Agreement: ${confidenceBreakdown.factors.sourceAgreement.score}% - ${confidenceBreakdown.factors.sourceAgreement.details}
- Information Recency: ${confidenceBreakdown.factors.recencyScore.score}% - ${confidenceBreakdown.factors.recencyScore.details}
- Language Certainty: ${confidenceBreakdown.factors.certaintyScore.score}% - ${confidenceBreakdown.factors.certaintyScore.details}`;
  
  return `Question: ${question}

${confidenceContext}

Search Results:
${sourceSummary}

Based on the above search results and confidence analysis, provide a response that matches the confidence level. Remember to be transparent about uncertainties and limitations.`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(rawResponse, searchResults, confidenceBreakdown) {
  // Extract potential biases and limitations
  const biases = extractBiases(rawResponse, searchResults);
  const limitations = extractLimitations(rawResponse, confidenceBreakdown);
  const controversies = extractControversies(rawResponse, searchResults);
  
  // Identify which sources were actually used
  const citedSources = searchResults.filter((source, index) => {
    return rawResponse.toLowerCase().includes(source.domain.toLowerCase()) ||
           rawResponse.includes(`source ${index + 1}`) ||
           rawResponse.includes(source.title.substring(0, 20).toLowerCase());
  });
  
  return {
    success: true,
    response: {
      confidence: confidenceBreakdown.overall,
      confidenceLevel: confidenceBreakdown.level,
      mainResponse: rawResponse,
      shortResponse: extractShortAnswer(rawResponse),
      sources: citedSources.map(source => ({
        title: source.title,
        url: source.link,
        domain: source.domain,
        quality: source.quality,
        type: source.sourceType,
        snippet: source.snippet,
        publishedDate: source.metadata.publishedDate,
      })),
      factors: confidenceBreakdown.factors,
      biases: biases,
      controversies: controversies,
      limitations: limitations,
    },
    metadata: {
      searchResultsAnalyzed: searchResults.length,
      sourcesUsed: citedSources.length,
      responseLength: rawResponse.length,
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Extract short answer from response
 */
function extractShortAnswer(response) {
  // Get first paragraph or first 150 characters
  const firstParagraph = response.split('\n\n')[0];
  if (firstParagraph.length <= 150) {
    return firstParagraph;
  }
  
  // Find first sentence
  const firstSentence = response.match(/^[^.!?]+[.!?]/);
  if (firstSentence) {
    return firstSentence[0];
  }
  
  return firstParagraph.substring(0, 150) + '...';
}

/**
 * Extract potential biases from response and sources
 */
function extractBiases(response, searchResults) {
  const biases = [];
  
  // Check for geographic bias
  const domains = searchResults.map(r => r.domain);
  const usDomainsCount = domains.filter(d => d.endsWith('.gov') || d.endsWith('.com')).length;
  if (usDomainsCount > domains.length * 0.7) {
    biases.push('Sources primarily from US perspectives');
  }
  
  // Check for institutional bias
  const govSourcesCount = searchResults.filter(r => r.sourceType === 'government').length;
  if (govSourcesCount > searchResults.length * 0.6) {
    biases.push('Heavy reliance on government sources');
  }
  
  // Check for temporal bias
  const recentSources = searchResults.filter(r => {
    if (!r.metadata.publishedDate) return false;
    const date = new Date(r.metadata.publishedDate);
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    return date > yearAgo;
  });
  if (recentSources.length < searchResults.length * 0.3) {
    biases.push('Limited recent sources - findings may be outdated');
  }
  
  // Check for commercial bias
  if (response.toLowerCase().includes('sponsored') || 
      searchResults.some(r => r.snippet.toLowerCase().includes('sponsored'))) {
    biases.push('Some sources may have commercial interests');
  }
  
  return biases;
}

/**
 * Extract limitations from the analysis
 */
function extractLimitations(response, confidenceBreakdown) {
  const limitations = [];
  
  // Based on confidence factors
  if (confidenceBreakdown.factors.sourceQuality.score < 70) {
    limitations.push('Limited access to high-quality primary sources');
  }
  
  if (confidenceBreakdown.factors.sourceAgreement.score < 60) {
    limitations.push('Sources show significant disagreement on key points');
  }
  
  if (confidenceBreakdown.factors.recencyScore.score < 70) {
    limitations.push('Some information may be outdated');
  }
  
  if (confidenceBreakdown.factors.certaintyScore.score < 60) {
    limitations.push('Sources use uncertain or speculative language');
  }
  
  // Check for missing perspectives
  if (response.toLowerCase().includes('however') || response.toLowerCase().includes('although')) {
    limitations.push('Complex topic with multiple valid perspectives');
  }
  
  // Check for data limitations
  if (response.toLowerCase().includes('limited data') || response.toLowerCase().includes('more research')) {
    limitations.push('Scientific consensus still developing');
  }
  
  return limitations;
}

/**
 * Extract areas of controversy
 */
function extractControversies(response, searchResults) {
  const controversies = [];
  
  // Keywords indicating controversy
  const controversyKeywords = [
    'debate', 'controversy', 'disputed', 'contested', 'disagreement',
    'critics argue', 'opponents claim', 'conflicting', 'contentious'
  ];
  
  const responseText = response.toLowerCase();
  const snippets = searchResults.map(r => r.snippet.toLowerCase()).join(' ');
  const combinedText = responseText + ' ' + snippets;
  
  for (const keyword of controversyKeywords) {
    if (combinedText.includes(keyword)) {
      // Try to extract context
      const regex = new RegExp(`[^.]*${keyword}[^.]*\\.`, 'i');
      const match = response.match(regex);
      if (match) {
        controversies.push(match[0].trim());
      }
    }
  }
  
  // Check for explicit disagreements in sources
  const positions = new Set();
  searchResults.forEach(result => {
    if (result.snippet.match(/\b(yes|no|true|false|safe|unsafe|effective|ineffective)\b/i)) {
      positions.add(result.snippet.match(/\b(yes|no|true|false|safe|unsafe|effective|ineffective)\b/i)[0]);
    }
  });
  
  if (positions.size > 1 && (positions.has('yes') && positions.has('no')) || 
      (positions.has('safe') && positions.has('unsafe'))) {
    controversies.push('Sources present conflicting conclusions');
  }
  
  return [...new Set(controversies)]; // Remove duplicates
}

/**
 * Generate fallback response when AI generation fails
 */
function generateFallbackResponse(question, confidenceBreakdown) {
  const confidence = confidenceBreakdown.overall;
  const level = confidenceBreakdown.level;
  
  if (level === 'high') {
    return `Based on my search results (${confidence}% confidence), I found relevant information about your question. However, I'm experiencing a technical issue generating a complete response. Please try again in a moment.`;
  } else if (level === 'medium') {
    return `I found some relevant information about your question with ${confidence}% confidence, though sources show mixed results. I'm experiencing a technical issue generating a detailed response. Please try again shortly.`;
  } else {
    return `I found limited reliable information about your question (${confidence}% confidence). The available sources don't provide clear answers, and I'm also experiencing a technical issue. You might want to try rephrasing your question or consulting specialized sources directly.`;
  }
}

/**
 * Generate a response for when no search results are found
 */
export function generateNoResultsResponse(question) {
  return {
    success: true,
    response: {
      confidence: 0,
      confidenceLevel: 'none',
      mainResponse: `I couldn't find any reliable information to answer your question: "${question}". This could mean:

1. The topic is very specialized or new
2. My search terms need adjustment
3. The information isn't publicly available

Would you like me to try searching with different terms, or can you provide more context about what you're looking for?`,
      shortResponse: "I couldn't find reliable information to answer this question.",
      sources: [],
      factors: {
        sourceQuality: { score: 0, details: 'No sources found' },
        sourceAgreement: { score: 0, details: 'No sources to compare' },
        recencyScore: { score: 0, details: 'No dated sources available' },
        certaintyScore: { score: 0, details: 'No text to analyze' },
      },
      biases: ['No sources available for analysis'],
      controversies: [],
      limitations: 'Unable to find relevant information through web search',
    },
    metadata: {
      searchResultsAnalyzed: 0,
      sourcesUsed: 0,
      timestamp: new Date().toISOString(),
    },
  };
}