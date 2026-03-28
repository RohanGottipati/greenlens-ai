'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ANALYSIS_FINALIZING_TIMEOUT_MS,
  ANALYSIS_POLLING_TIMEOUT_MS,
  ANALYSIS_POLL_INTERVAL_MS,
  isActiveAnalysisStatus,
  type AnalysisJobState,
} from '@/lib/analysis/state'
import { shouldApplyPollResponse } from '@/lib/analysis/polling-sequencing'

interface UseAnalysisJobOptions {
  initialJobState?: AnalysisJobState | null
  onComplete?: (jobState: AnalysisJobState) => void
}

const AGENT_LABELS: Record<string, string> = {
  usage_analyst: 'Collecting usage data',
  stat_analysis: 'Running statistical analysis',
  carbon_water_accountant: 'Calculating carbon and water impact',
  license_intelligence: 'Reviewing license utilization',
  strategic_translator: 'Generating strategic recommendations',
  synthesis: 'Finalizing your report',
}

function getStatusMessage(jobState: AnalysisJobState | null) {
  if (!jobState) return null
  if (jobState.status === 'pending') return 'Queued and about to begin.'
  if (jobState.status === 'finalizing') return 'Finalizing your report.'
  if (jobState.current_agent) {
    return AGENT_LABELS[jobState.current_agent] ?? 'Analysis in progress.'
  }
  if (jobState.status === 'running') return 'Analysis in progress.'
  if (jobState.status === 'failed') return jobState.error_message ?? 'Analysis failed.'
  return null
}

export function useAnalysisJob({
  initialJobState = null,
  onComplete,
}: UseAnalysisJobOptions) {
  const [jobState, setJobState] = useState<AnalysisJobState | null>(initialJobState)
  const [error, setError] = useState<string | null>(initialJobState?.error_message ?? null)
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAbortRef = useRef<AbortController | null>(null)
  const pollStartRef = useRef<number | null>(null)
  const pollSessionRef = useRef(0)
  const requestTokenRef = useRef(0)
  const appliedTokenRef = useRef(0)
  const finalizingStartedAtRef = useRef<number | null>(null)

  const stopPolling = useCallback(() => {
    pollSessionRef.current += 1

    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (pollAbortRef.current) {
      pollAbortRef.current.abort()
      pollAbortRef.current = null
    }

    pollStartRef.current = null
    finalizingStartedAtRef.current = null
  }, [])

  const handleTerminalState = useCallback((nextState: AnalysisJobState) => {
    setJobState(nextState)
    if (nextState.status === 'failed') {
      setError(nextState.error_message ?? 'Analysis failed')
      return
    }

    setError(null)
    if (nextState.status === 'complete' && nextState.reportId) {
      onComplete?.(nextState)
    }
  }, [onComplete])

  function schedulePoll(jobId: string, sessionId: number, delayMs = ANALYSIS_POLL_INTERVAL_MS) {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current)
    }
    pollTimerRef.current = setTimeout(() => {
      void pollStatus(jobId, sessionId)
    }, delayMs)
  }

  const pollStatus = useCallback(async (jobId: string, sessionId = pollSessionRef.current) => {
    if (sessionId !== pollSessionRef.current) {
      return
    }

    // Client-side safety valve: stop polling if we've been waiting too long.
    if (pollStartRef.current && Date.now() - pollStartRef.current > ANALYSIS_POLLING_TIMEOUT_MS) {
      stopPolling()
      setError('Analysis is taking longer than expected. Please reload the page and try again.')
      return
    }

    const requestToken = ++requestTokenRef.current
    const controller = new AbortController()
    pollAbortRef.current = controller

    try {
      const response = await fetch(`/api/pipeline/status?jobId=${jobId}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Failed to fetch analysis status')

      const data = await response.json() as AnalysisJobState

      if (!shouldApplyPollResponse(
        pollSessionRef.current,
        sessionId,
        requestToken,
        appliedTokenRef.current
      )) {
        return
      }

      appliedTokenRef.current = requestToken
      setJobState(data)

      if (data.status === 'finalizing') {
        finalizingStartedAtRef.current ??= Date.now()
      } else {
        finalizingStartedAtRef.current = null
      }

      if (
        finalizingStartedAtRef.current &&
        Date.now() - finalizingStartedAtRef.current > ANALYSIS_FINALIZING_TIMEOUT_MS
      ) {
        stopPolling()
        setError('Analysis finished but the report did not update. Please rerun the analysis.')
        return
      }

      if (data.status === 'failed' || (data.status === 'complete' && data.reportId)) {
        stopPolling()
        handleTerminalState(data)
        return
      }

      setError(null)
      schedulePoll(jobId, sessionId)
    } catch (pollError) {
      if (controller.signal.aborted || sessionId !== pollSessionRef.current) {
        return
      }

      stopPolling()
      setError(pollError instanceof Error ? pollError.message : 'Failed to fetch analysis status')
    } finally {
      if (pollAbortRef.current === controller) {
        pollAbortRef.current = null
      }
    }
  }, [handleTerminalState, stopPolling])

  const startPolling = useCallback((jobId: string) => {
    stopPolling()
    requestTokenRef.current = 0
    appliedTokenRef.current = 0
    pollStartRef.current = Date.now()
    const sessionId = pollSessionRef.current
    void pollStatus(jobId, sessionId)
  }, [pollStatus, stopPolling])

  const triggerAnalysis = useCallback(async () => {
    stopPolling()
    setError(null)

    try {
      const response = await fetch('/api/pipeline/trigger', { method: 'POST' })
      if (!response.ok) throw new Error('Failed to start analysis')

      const data = await response.json() as AnalysisJobState
      setJobState(data)

      if (data.status === 'complete' && data.reportId) {
        handleTerminalState(data)
        return
      }

      if (isActiveAnalysisStatus(data.status)) {
        startPolling(data.jobId)
      }
    } catch (triggerError) {
      setError(triggerError instanceof Error ? triggerError.message : 'Failed to start analysis')
    }
  }, [handleTerminalState, startPolling, stopPolling])

  useEffect(() => {
    setJobState(initialJobState)
    setError(initialJobState?.error_message ?? null)
  }, [initialJobState])

  useEffect(() => {
    if (initialJobState && isActiveAnalysisStatus(initialJobState.status)) {
      startPolling(initialJobState.jobId)
    }

    return () => {
      stopPolling()
    }
  }, [initialJobState, startPolling, stopPolling])

  const status = jobState?.status ?? null
  const loading = status ? isActiveAnalysisStatus(status) : false
  const statusMessage = getStatusMessage(jobState)

  return {
    error,
    jobState,
    loading,
    status,
    statusMessage,
    triggerAnalysis,
    isActive: status ? isActiveAnalysisStatus(status) : false,
  }
}
