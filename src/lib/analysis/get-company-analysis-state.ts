import type { SupabaseClient } from '@supabase/supabase-js'
import {
  ANALYSIS_FINALIZING_TIMEOUT_MESSAGE,
  buildAnalysisJobState,
  buildFailedAnalysisJobState,
  hasFinalizingTimedOut,
  type AnalysisJobState,
} from '@/lib/analysis/state'

interface CompanyAnalysisState {
  analysisJob: AnalysisJobState | null
}

export async function getCompanyAnalysisState(
  supabase: SupabaseClient,
  companyId: string
): Promise<CompanyAnalysisState> {
  const { data: latestJob } = await supabase
    .from('analysis_jobs')
    .select('id, status, current_agent, error_message, completed_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latestJob) {
    return { analysisJob: null }
  }

  let reportId: string | null = null

  if (latestJob.status === 'complete') {
    const { data: reportForJob } = await supabase
      .from('reports')
      .select('id')
      .eq('job_id', latestJob.id)
      .maybeSingle()

    reportId = reportForJob?.id ?? null
  }

  if (hasFinalizingTimedOut(latestJob, reportId)) {
    return {
      analysisJob: buildFailedAnalysisJobState(latestJob.id, ANALYSIS_FINALIZING_TIMEOUT_MESSAGE),
    }
  }

  return {
    analysisJob: buildAnalysisJobState(latestJob, reportId),
  }
}
