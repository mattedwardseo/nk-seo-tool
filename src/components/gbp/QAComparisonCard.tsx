'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
} from 'lucide-react'

interface QAData {
  question_text?: string | null
  original_question_text?: string | null
  time_ago?: string | null
  timestamp?: string | null
  items?: Array<{
    answer_text?: string | null
    profile_name?: string | null
  }> | null
}

interface BusinessQAData {
  businessName: string
  gmbCid: string
  questionsCount: number | null
  answeredCount: number | null
  unansweredCount: number | null
  recentQA: QAData[] | null
  qaFetchedAt: string | null
}

interface QAComparisonCardProps {
  target: BusinessQAData | null
  competitors: BusinessQAData[]
}

export function QAComparisonCard({
  target,
  competitors,
}: QAComparisonCardProps): React.ReactElement {
  // Calculate stats
  const hasData = target?.qaFetchedAt || competitors.some((c) => c.qaFetchedAt)
  const maxQuestions = Math.max(
    target?.questionsCount ?? 0,
    ...competitors.map((c) => c.questionsCount ?? 0),
    1
  )

  const getAnswerRate = (answered: number | null, total: number | null): number => {
    if (!total || total === 0) return 0
    return ((answered ?? 0) / total) * 100
  }

  const targetAnswerRate = getAnswerRate(target?.answeredCount ?? null, target?.questionsCount ?? null)
  const avgCompetitorAnswerRate = competitors.length > 0
    ? competitors.reduce((sum, c) => sum + getAnswerRate(c.answeredCount ?? null, c.questionsCount ?? null), 0) / competitors.length
    : 0

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Q&A Comparison
          </CardTitle>
          <CardDescription>
            Click &quot;Fetch Data&quot; above to load Q&A data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No Q&A data available yet</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasUnanswered = (target?.unansweredCount ?? 0) > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Q&A Comparison
        </CardTitle>
        <CardDescription>
          Questions and answers on Google Business Profiles
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{target?.questionsCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Questions</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{target?.answeredCount ?? 0}</div>
            <div className="text-xs text-muted-foreground">Answered</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {target?.unansweredCount ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Unanswered</div>
          </div>
        </div>

        {/* Unanswered Alert */}
        {hasUnanswered && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700 dark:text-red-400">
                You have {target?.unansweredCount} unanswered question{target?.unansweredCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Answering questions improves your profile and helps potential patients
            </p>
          </div>
        )}

        {/* Answer Rate Comparison */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Your Answer Rate</span>
            <span className="font-medium">{Math.round(targetAnswerRate)}%</span>
          </div>
          <Progress value={targetAnswerRate} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Competitor Avg: {Math.round(avgCompetitorAnswerRate)}%</span>
            {targetAnswerRate >= avgCompetitorAnswerRate ? (
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Above Average
              </Badge>
            ) : (
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Below Average
              </Badge>
            )}
          </div>
        </div>

        {/* Questions Bar Chart */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Questions Count</h4>

          {/* Target */}
          {target && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate max-w-[60%]">
                  {target.businessName}
                </span>
                <Badge variant="secondary" className="text-xs">You</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={((target.questionsCount ?? 0) / maxQuestions) * 100}
                  className="flex-1"
                />
                <span className="text-sm w-8 text-right">{target.questionsCount ?? 0}</span>
              </div>
            </div>
          )}

          {/* Competitors */}
          {competitors.map((comp) => (
            <div key={comp.gmbCid}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm truncate max-w-[80%]">{comp.businessName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={((comp.questionsCount ?? 0) / maxQuestions) * 100}
                  className="flex-1 [&>div]:bg-muted-foreground"
                />
                <span className="text-sm w-8 text-right text-muted-foreground">
                  {comp.questionsCount ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Q&A Preview */}
        {target?.recentQA && target.recentQA.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Recent Questions
            </h4>
            <div className="space-y-3">
              {target.recentQA.slice(0, 3).map((qa, index) => {
                const questionText = qa.question_text || qa.original_question_text
                const hasAnswer = qa.items && qa.items.length > 0
                const firstAnswer = qa.items?.[0]

                return (
                  <div
                    key={index}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium line-clamp-2">
                          {questionText || 'Question not available'}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {qa.time_ago || 'Unknown time'}
                        </span>
                      </div>
                    </div>

                    {hasAnswer ? (
                      <div className="flex items-start gap-2 ml-4 pl-2 border-l-2 border-green-500">
                        <MessageCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {firstAnswer?.answer_text || 'Answer not available'}
                          </p>
                          {firstAnswer?.profile_name && (
                            <span className="text-xs text-muted-foreground">
                              — {firstAnswer.profile_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="ml-4 pl-2 border-l-2 border-red-500">
                        <Badge variant="destructive" className="text-xs">
                          Needs Answer
                        </Badge>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recommendation */}
        {hasUnanswered && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Action Required:</strong> Answer unanswered questions promptly.
            This shows engagement and helps potential patients find information.
          </div>
        )}

        {!hasUnanswered && (target?.questionsCount ?? 0) === 0 && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Tip:</strong> Encourage patients to ask questions on your GBP.
            Q&A sections help answer common queries and improve your profile visibility.
          </div>
        )}
      </CardContent>
    </Card>
  )
}
