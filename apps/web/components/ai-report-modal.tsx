'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface AiReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  report: any;
}

export default function AiReportModal({ isVisible, onClose, report }: AiReportModalProps) {
  if (!isVisible || !report) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold">AI Trading Report</h2>
              <p className="text-gray-600">
                {report.reportType.charAt(0).toUpperCase() + report.reportType.slice(1)} Analysis
                for {report.symbol}
              </p>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Executive Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{report.summary}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {report.analysis.market_sentiment}
                  </div>
                  <div className="text-sm text-gray-500">Market Sentiment</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${report.analysis.recommendation === 'BUY' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {report.analysis.recommendation}
                  </div>
                  <div className="text-sm text-gray-500">Recommendation</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {report.analysis.target_price}
                  </div>
                  <div className="text-sm text-gray-500">Target Price</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">
                    {Math.round(report.analysis.confidence * 100)}%
                  </div>
                  <div className="text-sm text-gray-500">Confidence</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Points */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Key Analysis Points</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.key_points.map((point: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Technical Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Indicators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(report.technical_analysis.indicators).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span className="text-gray-700">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Success Probability:</span>
                    <span className="text-gray-700">
                      {Math.round(report.risk_assessment.probability_of_success * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Max Drawdown:</span>
                    <span className="text-gray-700">
                      {Math.round(report.risk_assessment.max_drawdown * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Risk/Reward:</span>
                    <span className="text-gray-700">
                      {report.risk_assessment.reward_risk_ratio}:1
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Volatility:</span>
                    <span className="text-gray-700">{report.risk_assessment.volatility}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Support and Resistance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Support Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.technical_analysis.support_levels.map((level: number, index: number) => (
                    <div key={index} className="flex justify-between bg-green-50 p-2 rounded">
                      <span className="font-medium">Level {index + 1}:</span>
                      <span className="text-green-700">{level}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resistance Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {report.technical_analysis.resistance_levels.map(
                    (level: number, index: number) => (
                      <div key={index} className="flex justify-between bg-red-50 p-2 rounded">
                        <span className="font-medium">Level {index + 1}:</span>
                        <span className="text-red-700">{level}</span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trading Plan */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Recommended Trading Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-800">Entry Point</div>
                  <div className="text-2xl font-bold text-blue-900">Current Price</div>
                  <div className="text-sm text-blue-600">Market Entry</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-semibold text-green-800">Take Profit</div>
                  <div className="text-2xl font-bold text-green-900">
                    {report.analysis.target_price}
                  </div>
                  <div className="text-sm text-green-600">Target Level</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="font-semibold text-red-800">Stop Loss</div>
                  <div className="text-2xl font-bold text-red-900">{report.analysis.stop_loss}</div>
                  <div className="text-sm text-red-600">Risk Management</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>Generated on {new Date(report.generatedAt).toLocaleString()}</p>
            <p className="mt-1">Analysis timeframe: {report.timeframe}</p>
            <p className="mt-2 font-medium">
              ⚠️ This is AI-generated analysis. Please do your own research before making trading
              decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
