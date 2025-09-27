import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Star, TrendingUp, Target, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { AnalysisResult, parseAnalysisResponse, getScoreColor, getScoreBgColor, getScoreRingColor } from '../../lib/jsonParser';

interface AnalysisDashboardProps {
  analysisResponse: string;
}

export function AnalysisDashboard({ analysisResponse }: AnalysisDashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showRawJson, setShowRawJson] = useState(false);

  const analysisData = parseAnalysisResponse(analysisResponse);

  if (!analysisData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to Parse Analysis</h3>
          <p className="text-gray-600 mb-4">The analysis response couldn't be parsed as structured data.</p>
          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {showRawJson ? 'Hide' : 'Show'} Raw Response
          </button>
          {showRawJson && (
            <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm text-left overflow-auto">
              {analysisResponse}
            </pre>
          )}
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const CircularProgress = ({ score, size = 80 }: { score: number; size?: number }) => {
    const radius = (size - 8) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 10) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-500 ${getScoreRingColor(score)}`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score}
          </span>
        </div>
      </div>
    );
  };

  const CriteriaCard = ({ 
    title, 
    criteria, 
    icon: Icon, 
    sectionKey 
  }: { 
    title: string; 
    criteria: any; 
    icon: any; 
    sectionKey: string;
  }) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${getScoreBgColor(criteria.score)}`}>
              <Icon className={`h-6 w-6 ${getScoreColor(criteria.score)}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">Score: {criteria.score}/10</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <CircularProgress score={criteria.score} size={60} />
            <button
              onClick={() => toggleSection(sectionKey)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 space-y-3">
            <h4 className="font-medium text-gray-900">Feedback:</h4>
            <ul className="space-y-2">
              {criteria.feedback.map((item: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overall Score Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Analysis Results</h2>
            <p className="text-purple-100 text-lg">Overall Performance Score</p>
          </div>
          <div className="text-center">
            <CircularProgress score={analysisData.overall_score} size={120} />
            <p className="text-purple-100 mt-2 text-sm">Out of 10</p>
          </div>
        </div>
      </div>

      {/* Criteria Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CriteriaCard
          title="Rapport Building"
          criteria={analysisData.criteria.rapport_building}
          icon={MessageCircle}
          sectionKey="rapport"
        />
        <CriteriaCard
          title="Understanding Needs"
          criteria={analysisData.criteria.understanding_needs}
          icon={Target}
          sectionKey="needs"
        />
        <CriteriaCard
          title="Product Knowledge"
          criteria={analysisData.criteria.product_knowledge}
          icon={Star}
          sectionKey="knowledge"
        />
        <CriteriaCard
          title="Objection Handling"
          criteria={analysisData.criteria.objection_handling}
          icon={AlertCircle}
          sectionKey="objections"
        />
        <CriteriaCard
          title="Closing"
          criteria={analysisData.criteria.closing}
          icon={CheckCircle}
          sectionKey="closing"
        />
      </div>

      {/* Summary Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Strengths</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{analysisData.strengths_summary}</p>
        </div>

        {/* Areas for Improvement */}
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Areas for Improvement</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">{analysisData.improvement_summary}</p>
        </div>
      </div>

      {/* Training Points */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Star className="h-5 w-5 text-blue-600" />
          <span>Missed Training Points</span>
        </h3>
        <ul className="space-y-3">
          {analysisData.missed_training_points.map((point, index) => (
            <li key={index} className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
              </div>
              <span className="text-gray-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Raw JSON Toggle */}
      <div className="bg-gray-50 rounded-lg p-4">
        <button
          onClick={() => setShowRawJson(!showRawJson)}
          className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-2"
        >
          <span>{showRawJson ? 'Hide' : 'Show'} Raw JSON Response</span>
          {showRawJson ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showRawJson && (
          <pre className="mt-4 p-4 bg-white rounded-lg text-sm overflow-auto border">
            {JSON.stringify(analysisData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
