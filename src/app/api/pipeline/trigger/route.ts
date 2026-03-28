import { after, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runPipeline } from '@/lib/agents/orchestrator'
import { buildAnalysisJobState } from '@/lib/analysis/state'

// Extend the serverless function lifetime so after() can run the full pipeline.
export const maxDuration = 300

// Jobs stuck in pending/running longer than this are auto-failed.
const STUCK_JOB_MS = 5 * 60 * 1000

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id')
    .eq('supabase_user_id', user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: latestJob } = await supabase
    .from('analysis_jobs')
    .select('id, status, current_agent, error_message, created_at, started_at')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestJob) {
    const isPendingOrRunning = latestJob.status === 'pending' || latestJob.status === 'running'

    if (isPendingOrRunning) {
      const jobStartMs = new Date(latestJob.started_at ?? latestJob.created_at).getTime()
      const isStuck = Date.now() - jobStartMs > STUCK_JOB_MS

      if (!isStuck) {
        // Active job that isn't stuck — return its state so the client resumes polling.
        return NextResponse.json(buildAnalysisJobState(latestJob, null))
      }

      // Stuck job — mark it failed so we can start fresh.
      await supabase.from('analysis_jobs').update({
        status: 'failed',
        error_message: 'Analysis timed out. Please try again.',
        completed_at: new Date().toISOString(),
      }).eq('id', latestJob.id)

    } else if (latestJob.status === 'complete') {
      const { data: existingReport } = await supabase
        .from('reports')
        .select('id')
        .eq('job_id', latestJob.id)
        .maybeSingle()

      const reportId = existingReport?.id ?? null
      const existingJobState = buildAnalysisJobState(latestJob, reportId)

      // Still finalising (report write hasn't landed yet) — don't start a second run.
      if (existingJobState.status === 'finalizing') {
        return NextResponse.json(existingJobState)
      }
    }
    // failed or complete-with-report: fall through to create a new job.
  }

  const { data: job } = await supabase.from('analysis_jobs')
    .insert({ company_id: company.id, status: 'pending' })
    .select('id, status, current_agent, error_message')
    .single()

  after(async () => {
    await runPipeline(job!.id, company.id).catch(console.error)
  })

  return NextResponse.json(buildAnalysisJobState(job!, null))
}
