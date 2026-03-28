/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from '@/lib/supabase/admin'
import type { PostgrestError } from '@supabase/supabase-js'
import { backboard, FALLBACK_TRANSLATOR_OUTPUT } from '@/lib/backboard/client'
import {
  buildUnsupportedProviderStatus,
  deriveDataFreshness,
} from '@/lib/analysis/provider-status'
import { calculateCarbon } from '@/lib/calculations/carbon'
import type { IntegrationRecord } from '@/lib/integrations/types'
import { runUsageAnalyst } from './usage-analyst'
import { runCarbonWaterAccountant } from './carbon-water-accountant'
import { runLicenseIntelligence } from './license-intelligence'
import { runStrategicTranslator, runStrategicTranslatorGemini } from './strategic-translator'
import { runSynthesis } from './synthesis'
import { runStatAnalysis } from '@/lib/analysis/run-stat-analysis'

function throwIfSupabaseError(error: PostgrestError | null, context: string) {
  if (error) {
    throw new Error(`${context}: ${error.message}`)
  }
}

export async function runPipeline(jobId: string, companyId: string) {
  const supabase = createAdminClient()

  const withTimeout = async <T>(label: string, promise: Promise<T>, timeoutMs: number): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | null = null

    try {
      return await Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s`))
          }, timeoutMs)
        })
      ])
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  const setStatus = async (status: string, agent?: string) => {
    const { error } = await supabase.from('analysis_jobs').update({
      status, current_agent: agent || null,
      ...(status === 'running' && !agent ? { started_at: new Date().toISOString() } : {}),
      ...(['complete', 'failed'].includes(status) ? { completed_at: new Date().toISOString() } : {})
    }).eq('id', jobId)

    throwIfSupabaseError(error, `Failed to update analysis job ${jobId} to ${status}`)
  }

  const saveOutput = async (agentName: string, output: any) => {
    const { error } = await supabase
      .from('agent_outputs')
      .insert({ job_id: jobId, agent_name: agentName, output })

    throwIfSupabaseError(error, `Failed to persist ${agentName} output for job ${jobId}`)
  }

  const claimJobForExecution = async () => {
    const startedAt = new Date().toISOString()
    const { data, error } = await supabase
      .from('analysis_jobs')
      .update({
        status: 'running',
        current_agent: null,
        started_at: startedAt,
      })
      .eq('id', jobId)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle()

    throwIfSupabaseError(error, `Failed to claim analysis job ${jobId}`)

    return Boolean(data?.id)
  }

  // Safety net: if the pipeline hasn't finished within 4 minutes, mark it failed.
  // This fires even if an individual agent somehow escapes its own timeout.
  const PIPELINE_MAX_MS = 4 * 60 * 1000
  const pipelineGuard = setTimeout(async () => {
    console.error(`[Pipeline ${jobId}] Exceeded ${PIPELINE_MAX_MS / 1000}s, marking as failed`)
    const { error } = await supabase.from('analysis_jobs').update({
      status: 'failed',
      error_message: 'Analysis exceeded the maximum allowed duration. Please try again.',
      completed_at: new Date().toISOString(),
    }).eq('id', jobId).in('status', ['pending', 'running'])
    if (error) {
      console.error(`[Pipeline ${jobId}] Failed to mark timed out job as failed:`, error.message)
    }
  }, PIPELINE_MAX_MS)

  try {
    const claimed = await claimJobForExecution()
    if (!claimed) {
      clearTimeout(pipelineGuard)
      return null
    }

    // Attempt to create a Backboard thread for LLM-powered strategic analysis.
    // If Backboard is unavailable the pipeline continues without it.
    let threadId: string | null = null
    try {
      const assistant = await withTimeout(
        'Backboard setup',
        backboard.createAssistant(
          `GreenLens-${companyId}-${jobId}`,
          `You are the GreenLens analysis pipeline coordinator.
         You receive structured JSON findings from specialist agents and stat analysis.
         Store all findings in memory and make them available to subsequent agents.
         Always respond in valid JSON only. No markdown.`
        ),
        10000
      )
      const thread = await withTimeout(
        'Backboard thread',
        backboard.createThread(assistant.assistant_id ?? assistant.id),
        10000
      )
      threadId = thread.thread_id ?? thread.id ?? null
    } catch (backboardErr: any) {
      console.warn('Backboard unavailable, running without LLM strategic analysis:', backboardErr.message)
    }

    const { data: integrations } = await supabase.from('integrations').select('*')
      .eq('company_id', companyId).eq('is_active', true)
    const activeIntegrations = (integrations ?? []) as IntegrationRecord[]

    const { data: company } = await supabase.from('companies').select('*')
      .eq('id', companyId).single()

    // ── AGENT 1: Usage Analyst ────────────────────────────────────────
    await setStatus('running', 'usage_analyst')
    const usageResult = await withTimeout('Usage analyst', runUsageAnalyst(integrations || []), 20000)
    await saveOutput('usage_analyst', usageResult)
    if (threadId) {
      backboard.sendMessage(threadId, JSON.stringify({
        event: 'agent_complete', agent: 'usage_analyst', findings: usageResult
      })).catch(e => console.warn('Backboard message failed:', e.message))
    }

    const precomputedCarbon = await withTimeout(
      'Carbon baseline',
      calculateCarbon(usageResult.normalizedUsage),
      10000
    )

    // ── STAT ANALYSIS ─────────────────────────────────────────────────
    await setStatus('running', 'stat_analysis')
    const statResult = await runStatAnalysis({
      normalizedUsage: usageResult.normalizedUsage,
      dailyRequestCounts: usageResult.dailyRequestCounts || [],
      totalCarbonKg: precomputedCarbon.totalCarbonKg,
      industry: company?.industry || 'default'
    })
    await saveOutput('stat_analysis', statResult)
    if (threadId) {
      backboard.sendMessage(threadId, JSON.stringify({
        event: 'stat_analysis_complete', findings: statResult
      })).catch(e => console.warn('Backboard message failed:', e.message))
    }

    // ── AGENT 2: Carbon & Water Accountant ────────────────────────────
    await setStatus('running', 'carbon_water_accountant')
    const carbonWaterResult = await withTimeout(
      'Carbon & water accountant',
      runCarbonWaterAccountant(usageResult, statResult, precomputedCarbon),
      15000
    )
    await saveOutput('carbon_water_accountant', carbonWaterResult)
    if (threadId) {
      backboard.sendMessage(threadId, JSON.stringify({
        event: 'agent_complete', agent: 'carbon_water_accountant', findings: carbonWaterResult
      })).catch(e => console.warn('Backboard message failed:', e.message))
    }

    // ── AGENT 3: License Intelligence ─────────────────────────────────
    await setStatus('running', 'license_intelligence')
    const licenseResult = await withTimeout('License intelligence', runLicenseIntelligence(integrations || []), 20000)
    await saveOutput('license_intelligence', licenseResult)
    if (threadId) {
      backboard.sendMessage(threadId, JSON.stringify({
        event: 'agent_complete', agent: 'license_intelligence', findings: licenseResult
      })).catch(e => console.warn('Backboard message failed:', e.message))
    }

    // ── AGENT 4: Strategic Translator ─────────────────────────────────
    await setStatus('running', 'strategic_translator')
    let translatorResult: any = FALLBACK_TRANSLATOR_OUTPUT
    if (threadId) {
      try {
        translatorResult = await withTimeout(
          'Strategic translator',
          runStrategicTranslator(threadId, usageResult, carbonWaterResult, licenseResult, statResult, company),
          25000
        )
      } catch (translatorErr: any) {
        console.warn('Backboard strategic translator failed, falling back to Gemini:', translatorErr.message)
        try {
          translatorResult = await withTimeout(
            'Strategic translator (Gemini)',
            runStrategicTranslatorGemini(usageResult, carbonWaterResult, licenseResult, statResult, company),
            35000
          )
        } catch (geminiErr: any) {
          console.warn('Gemini strategic translator unavailable, using deterministic fallback:', geminiErr.message)
          translatorResult = buildFallbackTranslation(usageResult, carbonWaterResult, licenseResult, statResult, company)
        }
      }
    } else {
      // No Backboard thread — try Gemini directly
      try {
        translatorResult = await withTimeout(
          'Strategic translator (Gemini)',
          runStrategicTranslatorGemini(usageResult, carbonWaterResult, licenseResult, statResult, company),
          35000
        )
      } catch (geminiErr: any) {
        console.warn('Gemini strategic translator unavailable, using deterministic fallback:', geminiErr.message)
        translatorResult = buildFallbackTranslation(usageResult, carbonWaterResult, licenseResult, statResult, company)
      }
    }
    await saveOutput('strategic_translator', translatorResult)

    const providerStatuses = [
      ...usageResult.providerStatus,
      ...licenseResult.providerStatus,
      ...activeIntegrations
        .filter((integration) =>
          integration.provider !== 'openai' &&
          integration.provider !== 'microsoft'
        )
        .map((integration) =>
          buildUnsupportedProviderStatus(
            integration.provider,
            `${integration.provider} is connected but is not yet included in the automated analysis pipeline.`
          )
        ),
    ]
    const dataFreshness = deriveDataFreshness(providerStatuses)

    // ── SYNTHESIS ─────────────────────────────────────────────────────
    await setStatus('running', 'synthesis')
    const reportId = await withTimeout('Synthesis', runSynthesis(jobId, companyId, {
      usage: usageResult, carbonWater: carbonWaterResult,
      license: licenseResult, translator: translatorResult,
      statAnalysis: statResult,
      meta: {
        dataFreshness,
        providerStatuses,
      },
    }), 30000)

    await setStatus('complete')
    clearTimeout(pipelineGuard)
    return reportId

  } catch (error: any) {
    clearTimeout(pipelineGuard)
    const { error: updateError } = await supabase.from('analysis_jobs').update({
      status: 'failed', error_message: error.message,
      completed_at: new Date().toISOString()
    }).eq('id', jobId)
    if (updateError) {
      console.error(`[Pipeline ${jobId}] Failed to mark job as failed:`, updateError.message)
    }
    throw error
  }
}

// Generates basic strategic output from data without requiring Backboard/LLM
function buildFallbackTranslation(usage: any, carbonWater: any, license: any, stat: any, company: any) {
  const decisions: any[] = []
  const mitigationStrategies: any[] = []

  if (carbonWater.modelTaskMismatchRate > 20) {
    decisions.push({
      title: 'Right-size models for classification tasks',
      situation: `${carbonWater.modelTaskMismatchRate}% of API calls use frontier models for tasks suited to smaller models. Switching these to efficient alternatives reduces costs and carbon.`,
      carbonSavedKg: carbonWater.carbonSavingsKg,
      waterSavedLiters: carbonWater.waterSavingsLiters,
      financialImpact: 'Significant cost reduction on API spend',
      theDecision: 'Migrate high-volume, low-complexity workflows to smaller model variants.',
      teamEffort: '1-2 weeks for engineering team',
      riskOfInaction: 'Unnecessary API costs continue to compound month over month.',
      urgency: 'Act This Quarter',
      impactScore: 8
    })
  }

  if (license.potentialAnnualSavings > 0) {
    decisions.push({
      title: 'Right-size AI licenses at renewal',
      situation: `${license.totalDormantSeats} of ${license.totalLicensedSeats} licensed seats are inactive. Reducing seat count at renewal captures immediate savings.`,
      carbonSavedKg: 0,
      waterSavedLiters: 0,
      financialImpact: `$${license.potentialAnnualSavings?.toLocaleString()}/year`,
      theDecision: 'Reduce licensed seat count to active users plus a 15% buffer.',
      teamEffort: 'Procurement action at renewal date',
      riskOfInaction: `$${license.potentialAnnualSavings?.toLocaleString()} in wasted spend annually.`,
      urgency: 'Act Before Renewal',
      impactScore: 7
    })
  }

  if (carbonWater.modelEfficiencyScore < 60) {
    mitigationStrategies.push(
      {
        strategy: 'Implement model routing by task complexity',
        description: 'Route simple classification and Q&A tasks to small models (gpt-4o-mini, claude-haiku) and reserve frontier models for complex reasoning.',
        expectedScoreImprovement: '+15-25 points in 30 days',
        effort: 'Medium',
        timeframe: '30 days'
      },
      {
        strategy: 'Add prompt caching for repeated queries',
        description: 'Enable prompt caching for your highest-volume use cases to reduce token consumption and carbon per query.',
        expectedScoreImprovement: '+5-10 points in 60 days',
        effort: 'Low',
        timeframe: '60 days'
      },
      {
        strategy: 'Audit and remove unused model integrations',
        description: 'Identify models with low request volume and high per-token cost. Consolidate to fewer, more efficient models.',
        expectedScoreImprovement: '+5-15 points in 90 days',
        effort: 'Low',
        timeframe: '90 days'
      }
    )
  }

  const narrative = [
    `${company?.name ?? 'Your organisation'} consumed ${carbonWater.totalCarbonKg?.toFixed(1)} kg CO2e and ${carbonWater.totalWaterLiters?.toLocaleString()} liters of water through AI usage this period.`,
    carbonWater.modelEfficiencyScore < 60
      ? `Model efficiency score of ${carbonWater.modelEfficiencyScore}/100 indicates significant optimisation opportunity.`
      : `Model efficiency score of ${carbonWater.modelEfficiencyScore}/100 is above the 60-point threshold.`,
    decisions.length > 0 ? `${decisions.length} strategic decision${decisions.length > 1 ? 's' : ''} identified this period.` : ''
  ].filter(Boolean).join(' ')

  return {
    decisions,
    incentivesAndBenefits: [],
    mitigationStrategies,
    hypeCycleContext: 'Enterprise AI deployments are entering a phase of scrutiny around ROI and sustainability. Organisations that establish clear efficiency metrics now will be well-positioned when AI governance requirements mature.',
    executiveNarrative: narrative,
    esgDisclosureText: `This disclosure covers AI-related Scope 3 emissions for the reporting period ${new Date().toISOString().slice(0, 7)}. Carbon calculations use model-specific energy intensity data (ArXiv 2505.09598), regional grid carbon intensity (EPA eGRID 2024 / IEA 2024), and a PUE of 1.1. Water consumption is estimated using WUE of 1.9 L/kWh with regional stress multipliers from the WRI Aqueduct database. Data collected via provider admin APIs only; no individual user content is accessed.`
  }
}
