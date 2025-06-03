import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, CheckCircle, XCircle, BarChart3, Shield, MessageSquare, Zap } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const exampleQuestions = [
    "Is there alien life in the universe?",
    "Should we ban TikTok?",
    "Will Bitcoin reach $1 million?",
    "What causes autism?",
    "Is nuclear energy safe?",
    "Will AI become conscious?",
  ];

  const handleTryQuestion = (question) => {
    if (isAuthenticated) {
      navigate('/chat', { state: { initialQuestion: question } });
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Finally, an AI That Says<br />
              <span className="text-yellow-300">"I Don't Know"</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-purple-100 max-w-3xl mx-auto">
              honestGPT researches every answer, cites real sources, and tells you exactly how confident it should be. 
              No hallucinations. No false certainty. Just transparent, trustworthy AI.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={isAuthenticated ? "/chat" : "/register"}
                className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                Start Free Trial <ArrowRight size={20} />
              </Link>
              <Link
                to="/pricing"
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-purple-600 transition"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It's Different */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            How honestGPT is Different
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* ChatGPT comparison */}
            <div className="bg-white rounded-lg shadow-lg p-8 relative">
              <div className="absolute top-4 right-4">
                <XCircle className="text-red-500" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-700">ChatGPT</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Can't search the web for current info</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Makes up facts when uncertain</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>No source citations</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Always sounds 100% confident</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Black box reasoning</span>
                </li>
              </ul>
            </div>

            {/* honestGPT comparison */}
            <div className="bg-white rounded-lg shadow-lg p-8 relative border-2 border-green-500">
              <div className="absolute top-4 right-4">
                <CheckCircle className="text-green-500" size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-green-600">honestGPT</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Searches trusted sources in real-time</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Says "I don't know" when appropriate</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Every claim linked to sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Shows exact confidence % (0-100)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <span>Transparent reasoning you can verify</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Built for Truth Seekers
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={Search}
              title="Real Research"
              description="Every response backed by searches from .gov, .edu, and peer-reviewed sources"
            />
            <FeatureCard
              icon={BarChart3}
              title="Confidence Scores"
              description="See exactly how confident the answer is based on source quality and consensus"
            />
            <FeatureCard
              icon={Shield}
              title="Bias Detection"
              description="Automatically identifies potential biases and missing perspectives"
            />
            <FeatureCard
              icon={Zap}
              title="Better Than GPT-4"
              description="Combines AI intelligence with real-time research for superior answers"
            />
          </div>
        </div>
      </section>

      {/* Try It Section */}
      <section className="py-16 lg:py-24 bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
            Try These Challenging Questions
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12">
            See how honestGPT handles questions that make other AIs hallucinate
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="space-y-4">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleTryQuestion(question)}
                  className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between group"
                >
                  <span className="text-lg">{question}</span>
                  <ArrowRight className="text-gray-400 group-hover:text-gray-600 transition" size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-12">
            Perfect For
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <UseCaseCard
              title="Researchers"
              description="Get literature reviews with real citations and confidence levels for each claim"
              emoji="🔬"
            />
            <UseCaseCard
              title="Journalists"
              description="Fact-check stories with government and academic sources, not random blogs"
              emoji="📰"
            />
            <UseCaseCard
              title="Students"
              description="Write papers with properly cited sources and understand argument strength"
              emoji="🎓"
            />
            <UseCaseCard
              title="Decision Makers"
              description="Make informed choices with transparent analysis of evidence quality"
              emoji="💼"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready for AI That Admits Uncertainty?
          </h2>
          <p className="text-xl mb-8 text-purple-100">
            Join thousands who've switched to transparent, source-backed AI
          </p>
          <Link
            to={isAuthenticated ? "/chat" : "/register"}
            className="bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Start Free Trial <ArrowRight size={20} />
          </Link>
          <p className="mt-4 text-purple-200">
            10 free queries • No credit card required
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
        <Icon className="text-purple-600" size={24} />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseCard({ title, description, emoji }) {
  return (
    <div className="text-center">
      <div className="text-5xl mb-4">{emoji}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}