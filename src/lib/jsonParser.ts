// Utility to parse and validate JSON responses from Gemini API
export interface AnalysisCriteria {
  score: number;
  feedback: string[];
}

export interface AnalysisResult {
  overall_score: number;
  criteria: {
    rapport_building: AnalysisCriteria;
    understanding_needs: AnalysisCriteria;
    product_knowledge: AnalysisCriteria;
    objection_handling: AnalysisCriteria;
    closing: AnalysisCriteria;
  };
  missed_training_points: string[];
  strengths_summary: string;
  improvement_summary: string;
}

export function parseAnalysisResponse(response: string): AnalysisResult | null {
  try {
    // Try to extract JSON from the response (in case it's wrapped in markdown)
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;
    
    const parsed = JSON.parse(jsonString);
    
    // Validate the structure
    if (parsed.overall_score && parsed.criteria) {
      return parsed as AnalysisResult;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
    return null;
  }
}

export function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600';
  if (score >= 6) return 'text-yellow-600';
  if (score >= 4) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBgColor(score: number): string {
  if (score >= 8) return 'bg-green-100';
  if (score >= 6) return 'bg-yellow-100';
  if (score >= 4) return 'bg-orange-100';
  return 'bg-red-100';
}

export function getScoreRingColor(score: number): string {
  if (score >= 8) return 'stroke-green-500';
  if (score >= 6) return 'stroke-yellow-500';
  if (score >= 4) return 'stroke-orange-500';
  return 'stroke-red-500';
}

