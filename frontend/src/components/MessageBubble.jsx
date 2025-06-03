import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, AlertCircle, User, Bot } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export default function MessageBubble({ message }) {
  const [expandedSections, setExpandedSections] = useState({});
  const isUser = message.role === 'user';

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceTextColor = (confidence) => {
    if (confidence >= 80) return 'text-green-700';
    if (confidence >= 60) return 'text-yellow-700';
    return 'text-red-700';
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex items-start gap-3 max-w-2xl">
          <div className="bg-blue-600 text-white rounded-lg px-4 py-3">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
          <div className="flex-shrink-0 w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3 max-w-4xl w-full">
        <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
          <Bot size={16} className="text-white" />
        </div>
        
        <div className="flex-1 space-y-3">
          {/* Confidence Badge */}
          {message.confidence !== undefined && (
            <div className="flex items-center gap-3">
              <div className={clsx(
                'flex items-center gap-2 px-3 py-1 rounded-full text-white text-sm font-medium',
                getConfidenceColor(message.confidence)
              )}>
                <span>{message.confidence}%</span>
              </div>
              <span className={clsx('text-sm', getConfidenceTextColor(message.confidence))}>
                {message.confidenceLevel === 'high' && 'High confidence'}
                {message.confidenceLevel === 'medium' && 'Medium confidence'}
                {message.confidenceLevel === 'low' && 'Low confidence'}
              </span>
            </div>
          )}

          {/* Main Response */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="space-y-2">
            {/* Confidence Breakdown */}
            {message.factors && (
              <ExpandableSection
                title="📊 Confidence Breakdown"
                expanded={expandedSections.confidence}
                onToggle={() => toggleSection('confidence')}
              >
                <div className="space-y-3">
                  {Object.entries(message.factors).map(([key, factor]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={clsx('h-2 rounded-full', {
                                'bg-green-500': factor.score >= 80,
                                'bg-yellow-500': factor.score >= 60 && factor.score < 80,
                                'bg-red-500': factor.score < 60,
                              })}
                              style={{ width: `${factor.score}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-12 text-right">
                            {factor.score}%
                          </span>
                        </div>
                      </div>
                      {factor.details && (
                        <p className="text-sm text-gray-600 ml-4">{factor.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <ExpandableSection
                title={`📚 Sources (${message.sources.length})`}
                expanded={expandedSections.sources}
                onToggle={() => toggleSection('sources')}
              >
                <div className="space-y-3">
                  {message.sources.map((source, index) => (
                    <div 
                      key={index} 
                      className={clsx('border-l-4 pl-4', {
                        'border-green-500': source.quality === 'high',
                        'border-yellow-500': source.quality === 'medium',
                        'border-red-500': source.quality === 'limited',
                      })}
                    >
                      <div className="font-semibold text-gray-900">{source.title}</div>
                      <div className="text-sm text-gray-600">
                        {source.domain} • {source.type.replace(/_/g, ' ')} • 
                        <span className={clsx('capitalize ml-1', {
                          'text-green-600': source.quality === 'high',
                          'text-yellow-600': source.quality === 'medium',
                          'text-red-600': source.quality === 'limited',
                        })}>
                          {source.quality} quality
                        </span>
                      </div>
                      {source.snippet && (
                        <p className="text-sm text-gray-700 mt-1 italic">"{source.snippet}"</p>
                      )}
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1 mt-1"
                      >
                        View source <ExternalLink size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}

            {/* Biases & Limitations */}
            {((message.biases && message.biases.length > 0) || message.limitations) && (
              <ExpandableSection
                title="⚠️ Biases & Limitations"
                expanded={expandedSections.biases}
                onToggle={() => toggleSection('biases')}
              >
                <div className="space-y-3">
                  {message.biases && message.biases.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Potential Biases:</h4>
                      <ul className="space-y-2">
                        {message.biases.map((bias, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                            <AlertCircle size={16} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                            <span>{bias}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {message.limitations && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Limitations:</h4>
                      <p className="text-sm text-gray-700">{message.limitations}</p>
                    </div>
                  )}
                </div>
              </ExpandableSection>
            )}

            {/* Controversies */}
            {message.controversies && message.controversies.length > 0 && (
              <ExpandableSection
                title="💭 Points of Disagreement"
                expanded={expandedSections.controversies}
                onToggle={() => toggleSection('controversies')}
              >
                <div className="space-y-2">
                  {message.controversies.map((controversy, index) => (
                    <div key={index} className="bg-blue-50 p-3 rounded text-sm">
                      {controversy}
                    </div>
                  ))}
                </div>
              </ExpandableSection>
            )}
          </div>

          {/* Timestamp */}
          <div className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpandableSection({ title, expanded, onToggle, children }) {
  return (
    <div className="bg-gray-50 rounded-lg border">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition"
      >
        <span className="font-medium">{title}</span>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expanded && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
}