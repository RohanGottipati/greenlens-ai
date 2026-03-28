import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildAnalysisJobState } from '@/lib/analysis/state'

const STUCK_JOB_MS = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'Missing jobId' }, { status: 400 })

  const supabase = await createClient()
  const { data: job } = await supabase.from('analysis_jobs')
    .select('id, status, current_agent, error_message, created_at, started_at, completed_at')
    .eq('id', jobId)
    .maybeSingle()

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Auto-fail jobs that have been pending/running too long.
  if (job.status === 'pending' || job.status === 'running') {
    const jobStartMs = new Date(job.started_at ?? job.created_at).getTime()
    if (Date.now() - jobStartMs > STUCK_JOB_MS) {
      await supabase.from('analysis_jobs').update({
        status: 'failed',
        error_message: 'Analysis timed out. Please try again.',
        completed_at: new Date().toISOString(),
      }).eq('id', jobId)

      return NextResponse.json(buildAnalysisJobState(
        { ...job, status: 'failed', error_message: 'Analysis timed out. Please try again.' },
        null
      ))
    }
  }

  let reportId: string | null = null

  if (job.status === 'complete') {
    // Retry up to 3 times with a short delay to tolerate Supabase replication lag.
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: report } = await supabase
        .from('reports')
        .select('id')
        .eq('job_id', jobId)
        .maybeSingle()
      if (report?.id) { reportId = report.id; break }
      if (attempt < 2) await new Promise(r => setTimeout(r, 500))
    }
  }

  return NextResponse.json(buildAnalysisJobState(job, reportId))
}
