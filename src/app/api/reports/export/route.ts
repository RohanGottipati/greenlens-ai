import { NextResponse } from 'next/server'
import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
  Svg, Path, Line, G, Circle, Rect,
} from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { getPreferredReport } from '@/lib/reports/get-preferred-report'
import { generateWithGemini } from '@/lib/gemini/client'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ─── Colour palette ──────────────────────────────────────────────────────────

const COVER_BG    = '#1a3d2e'
const GREEN       = '#2d6a4f'
const GREEN_LIGHT = '#52b788'
const DARK        = '#152820'
const MUTED       = '#60726b'
const BG_CARD     = '#f4f8f6'
const BG_ACCENT   = '#e8f3ee'
const WHITE       = '#ffffff'
const RULE_COLOR  = '#cdddd5'

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Pages ──────────────────────────────────────────────────────────────────
  coverPage: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: COVER_BG,
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: DARK,
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
    lineHeight: 1.8,
  },

  // ── Cover page elements ────────────────────────────────────────────────────
  coverInner: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 56,
    paddingBottom: 60,
  },
  coverEyebrow: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: GREEN_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 18,
  },
  coverTitle: {
    fontSize: 36,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    lineHeight: 1.2,
    marginBottom: 10,
  },
  coverSubtitle: {
    fontSize: 16,
    fontFamily: 'Helvetica',
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 48,
  },
  coverDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    marginBottom: 36,
  },
  coverMetaGrid: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  coverMetaItem: {
    flex: 1,
  },
  coverMetaLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN_LIGHT,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 11,
    color: WHITE,
    lineHeight: 1.4,
  },
  coverFrameworkRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 40,
  },
  coverFrameworkBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  coverFrameworkText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  coverBrandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
  },
  coverBrandName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: GREEN_LIGHT,
  },
  coverBrandTagline: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  coverConfidential: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'right',
  },

  // ── Table of contents ──────────────────────────────────────────────────────
  tocTitle: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 6,
  },
  tocSubtitle: {
    fontSize: 10,
    color: MUTED,
    marginBottom: 28,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e4ede8',
  },
  tocNum: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    width: 28,
  },
  tocName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    flex: 1,
  },
  tocDesc: {
    fontSize: 9,
    color: MUTED,
    flex: 2,
    marginLeft: 12,
    lineHeight: 1.5,
  },

  // ── Section headings ────────────────────────────────────────────────────────
  sectionEyebrow: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 4,
  },
  sectionLead: {
    fontSize: 11,
    color: MUTED,
    lineHeight: 1.6,
    marginBottom: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: RULE_COLOR,
    marginBottom: 14,
  },
  subheading: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginTop: 14,
    marginBottom: 4,
  },

  // ── Body text ───────────────────────────────────────────────────────────────
  body: {
    fontSize: 10,
    color: DARK,
    lineHeight: 1.8,
    marginBottom: 10,
  },
  bodyMuted: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.7,
    marginBottom: 8,
  },

  // ── Metric stat cards ────────────────────────────────────────────────────
  statRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: BG_CARD,
    borderRadius: 5,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  statCardAlt: {
    flex: 1,
    backgroundColor: BG_CARD,
    borderRadius: 5,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: GREEN_LIGHT,
  },
  statLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
  },
  statValueAlt: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: GREEN_LIGHT,
  },
  statUnit: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
  },
  statDelta: {
    fontSize: 8,
    color: GREEN,
    marginTop: 3,
  },

  // ── Item / decision / incentive cards ──────────────────────────────────────
  itemCard: {
    backgroundColor: BG_CARD,
    borderRadius: 5,
    padding: 12,
    marginBottom: 8,
  },
  itemCardAccent: {
    backgroundColor: BG_ACCENT,
    borderRadius: 5,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
  },
  itemTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  itemBody: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.6,
  },
  impactBadge: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    backgroundColor: BG_ACCENT,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 5,
    alignSelf: 'flex-start',
  },

  // ── Methodology callout ─────────────────────────────────────────────────────
  methodBox: {
    borderLeftWidth: 2,
    borderLeftColor: GREEN_LIGHT,
    paddingLeft: 10,
    paddingVertical: 4,
    marginBottom: 10,
    backgroundColor: BG_CARD,
    borderRadius: 3,
  },
  methodLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  methodText: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.6,
  },

  // ── Model table ─────────────────────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: GREEN,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 1,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: BG_CARD,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 1,
    borderRadius: 2,
  },
  tableRowAlt: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 1,
    borderRadius: 2,
  },
  tableCell: {
    fontSize: 9,
    color: DARK,
  },
  tableCellMuted: {
    fontSize: 9,
    color: MUTED,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: RULE_COLOR,
    paddingTop: 7,
  },
  footerLeft: {
    fontSize: 7,
    color: MUTED,
  },
  footerRight: {
    fontSize: 7,
    color: MUTED,
  },

  // ── Hype cycle stage pills ──────────────────────────────────────────────────
  hypePillRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  hypePill: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: BG_CARD,
  },
  hypePillActive: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: GREEN,
  },
  hypePillText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hypePillTextActive: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: WHITE,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── ESG framework badges ────────────────────────────────────────────────────
  frameworkRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginBottom: 10,
    marginTop: 4,
  },
  frameworkBadge: {
    backgroundColor: BG_ACCENT,
    borderRadius: 3,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  frameworkText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: GREEN,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
})

// ─── Helper utilities ────────────────────────────────────────────────────────

type Json = Record<string, unknown>

function fmt(val: number | null | undefined, decimals = 0): string {
  if (val == null) return 'N/A'
  return val.toLocaleString('en-US', { maximumFractionDigits: decimals })
}

function fmtCurrency(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 })}M`
  if (val >= 1_000) return `$${(val / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`
  return `$${val.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

function str(val: unknown): string {
  if (val == null) return ''
  return String(val)
}

function pct(val: number | null | undefined): string {
  if (val == null) return 'N/A'
  return `${val.toFixed(1)}%`
}

function delta(current: number | null, previous: number | null): string {
  if (current == null || previous == null || previous === 0) return ''
  const diff = ((current - previous) / previous) * 100
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff.toFixed(1)}% vs prior period`
}

function normalizeProviderName(name: string): string {
  if (/copilot/i.test(name)) return 'OpenAI Tokens'
  return name
}

// ─── PDF Document ────────────────────────────────────────────────────────────

function EsgPDF({
  report,
  companyName,
  geminiNarrative,
  geminiGlobal,
}: {
  report: Json
  companyName: string
  geminiNarrative: string
  geminiGlobal: string
}) {
  // ── Destructure report sections ──────────────────────────────────────────
  const esg        = ((report.esg_disclosure            as Json) ?? {}) as Json
  const exec       = ((report.executive_summary         as Json) ?? {}) as Json
  const footprint  = ((report.footprint_detail          as Json) ?? {}) as Json
  const modelEff   = ((report.model_efficiency_analysis as Json) ?? {}) as Json
  const license    = ((report.license_intelligence      as Json) ?? {}) as Json
  const incData    = ((report.incentives_and_benefits   as Json) ?? {}) as Json
  const benchData  = ((report.benchmark_data            as Json) ?? {}) as Json
  const decData    = ((report.strategic_decisions       as Json) ?? {}) as Json

  // ── Core metrics ──────────────────────────────────────────────────────────
  const carbonKg       = (report.carbon_kg              as number | null) ?? null
  const waterLiters    = (report.water_liters           as number | null) ?? null
  const effScore       = (report.model_efficiency_score as number | null) ?? null
  const utilRate       = (report.license_utilization_rate as number | null) ?? null
  const carbonPct      = (report.carbon_percentile      as number | null) ?? null
  const trendDir       = str(report.trend_direction)
  const anomaly        = (report.anomaly_detected       as boolean | null) ?? null

  const prevCarbon     = (report.prev_carbon_kg              as number | null) ?? null
  const prevWater      = (report.prev_water_liters           as number | null) ?? null
  const prevEffScore   = (report.prev_model_efficiency_score as number | null) ?? null

  // ── Executive summary ────────────────────────────────────────────────────
  const narrative      = str(exec.narrative)
  const freshness      = str((exec.data_freshness as Json)?.latest_complete_day ?? (exec.data_freshness as Json)?.coverage_end)
  const frontierPct    = (exec.frontier_model_percentage as number | null) ?? null
  const hypeCtxExec    = str(exec.hype_cycle_context)
  const mitigations    = (exec.mitigation_strategies as unknown[]) ?? []

  // ── Footprint detail ──────────────────────────────────────────────────────
  const carbonByModel  = (footprint.carbon_by_model    as unknown[]) ?? []
  const altCarbon      = (footprint.alternative_carbon_kg as number | null) ?? null
  const carbonSavings  = (footprint.carbon_savings_kg  as number | null) ?? null
  const waterSavings   = (footprint.water_savings_liters as number | null) ?? null
  const carbonMethod   = str(esg.carbon_methodology ?? footprint.carbon_methodology)
  const waterMethod    = str(esg.water_methodology  ?? footprint.water_methodology)

  // ── Model efficiency ─────────────────────────────────────────────────────
  const inventory      = (modelEff.model_inventory     as unknown[]) ?? []
  const mismatchRate   = (modelEff.mismatch_rate        as number | null) ?? null
  const mismatchedClusters = (modelEff.mismatched_clusters as unknown[]) ?? []
  const taskClustering = (modelEff.task_clustering      as Json) ?? {}

  // ── License intelligence ──────────────────────────────────────────────────
  const totalSeats     = (license.totalLicensedSeats     as number | null) ?? null
  const activeSeats    = (license.totalActiveSeats       as number | null) ?? null
  const dormantSeats   = (license.totalDormantSeats      as number | null) ?? null
  const annualCost     = (license.estimatedAnnualLicenseCost as number | null) ?? null
  const annualSavings  = (license.potentialAnnualSavings    as number | null) ?? null
  const providers      = (license.providers              as unknown[]) ?? []
  const renewalAlerts  = (license.renewalAlerts          as unknown[]) ?? []

  // ── Incentives, benchmark, decisions, ESG ────────────────────────────────
  const incentiveList  = (incData.incentives as unknown[]) ?? []
  const hypeCtxBench   = str(benchData.hype_cycle_context ?? hypeCtxExec)
  const decisionList   = (decData.decisions as unknown[]) ?? []
  const frameworks     = (esg.frameworks as string[]) ?? ['CSRD', 'GRI 305', 'IFRS S2', 'CDP']
  const esgText        = str(esg.esg_text)
  const esgCarbonMethod = str(esg.carbon_methodology ?? carbonMethod)
  const esgWaterMethod  = str(esg.water_methodology  ?? waterMethod)

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const reportingPeriod = str(report.reporting_period) || 'Current Reporting Period'

  // ── Reusable sub-components ───────────────────────────────────────────────

  const Footer = () =>
    React.createElement(View, { style: styles.footer, fixed: true },
      React.createElement(Text, { style: styles.footerLeft },
        `${companyName}  ·  AI Environmental Impact Report  ·  Confidential`
      ),
      React.createElement(
        Text,
        {
          style: styles.footerRight,
          render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Page ${pageNumber} of ${totalPages}`,
        } as object
      ),
    )

  const SectionHead = ({
    num,
    title,
    lead,
  }: {
    num: string
    title: string
    lead?: string
  }) =>
    React.createElement(View, null,
      React.createElement(Text, { style: styles.sectionEyebrow }, `Section ${num}`),
      React.createElement(Text, { style: styles.sectionTitle }, title),
      lead ? React.createElement(Text, { style: styles.sectionLead }, lead) : null,
      React.createElement(View, { style: styles.divider }),
    )

  const Subheading = ({ children }: { children: string }) =>
    React.createElement(Text, { style: styles.subheading }, children)

  const BodyText = ({ children }: { children: string }) =>
    React.createElement(Text, { style: styles.body }, children)

  const MethodBox = ({ label, text }: { label: string; text: string }) =>
    text
      ? React.createElement(View, { style: styles.methodBox },
          React.createElement(Text, { style: styles.methodLabel }, label),
          React.createElement(Text, { style: styles.methodText }, text),
        )
      : null

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — COVER
  // ════════════════════════════════════════════════════════════════════════════

  const CoverPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.coverPage },
      React.createElement(View, { style: styles.coverInner },
        React.createElement(Text, { style: styles.coverEyebrow }, 'GreenLens AI  ·  Confidential Report'),
        React.createElement(Text, { style: styles.coverTitle }, companyName),
        React.createElement(Text, { style: styles.coverSubtitle }, 'AI Environmental Impact Report'),
        React.createElement(View, { style: styles.coverDivider }),
        React.createElement(View, { style: styles.coverMetaGrid },
          React.createElement(View, { style: styles.coverMetaItem },
            React.createElement(Text, { style: styles.coverMetaLabel }, 'Reporting Period'),
            React.createElement(Text, { style: styles.coverMetaValue }, reportingPeriod),
          ),
          React.createElement(View, { style: styles.coverMetaItem },
            React.createElement(Text, { style: styles.coverMetaLabel }, 'Data Through'),
            React.createElement(Text, { style: styles.coverMetaValue }, freshness || 'Current Period'),
          ),
          React.createElement(View, { style: styles.coverMetaItem },
            React.createElement(Text, { style: styles.coverMetaLabel }, 'Generated'),
            React.createElement(Text, { style: styles.coverMetaValue }, today),
          ),
          React.createElement(View, { style: styles.coverMetaItem },
            React.createElement(Text, { style: styles.coverMetaLabel }, 'Classification'),
            React.createElement(Text, { style: styles.coverMetaValue }, 'Confidential — Leadership Only'),
          ),
        ),
        React.createElement(Text, { style: { fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 10 } },
          'Framework Alignment'
        ),
        React.createElement(View, { style: styles.coverFrameworkRow },
          ...(frameworks as string[]).map((fw: string) =>
            React.createElement(View, { key: fw, style: styles.coverFrameworkBadge },
              React.createElement(Text, { style: styles.coverFrameworkText }, fw),
            )
          ),
        ),
        React.createElement(View, { style: styles.statRow },
          React.createElement(View, { style: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: 14 } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREEN_LIGHT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 } }, 'AI Carbon Usage'),
            React.createElement(Text, { style: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE } }, carbonKg != null ? fmt(carbonKg) : '—'),
            React.createElement(Text, { style: { fontSize: 8, color: 'rgba(255,255,255,0.5)' } }, 'kg CO₂e'),
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: 14 } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREEN_LIGHT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 } }, 'AI Water Usage'),
            React.createElement(Text, { style: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE } }, waterLiters != null ? fmt(waterLiters) : '—'),
            React.createElement(Text, { style: { fontSize: 8, color: 'rgba(255,255,255,0.5)' } }, 'litres'),
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: 14 } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREEN_LIGHT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 } }, 'Model Efficiency'),
            React.createElement(Text, { style: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE } }, effScore != null ? fmt(effScore) : '—'),
            React.createElement(Text, { style: { fontSize: 8, color: 'rgba(255,255,255,0.5)' } }, '/ 100'),
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: 14 } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: GREEN_LIGHT, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 } }, 'Licence Utilisation'),
            React.createElement(Text, { style: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: WHITE } }, utilRate != null ? `${fmt(utilRate, 1)}%` : '—'),
            React.createElement(Text, { style: { fontSize: 8, color: 'rgba(255,255,255,0.5)' } }, 'of seats active'),
          ),
        ),
        React.createElement(View, { style: styles.coverBrandingRow },
          React.createElement(View, null,
            React.createElement(Text, { style: styles.coverBrandName }, 'GreenLens AI'),
            React.createElement(Text, { style: styles.coverBrandTagline }, 'Measuring the true cost of enterprise AI'),
          ),
          React.createElement(Text, { style: styles.coverConfidential },
            `This document contains commercially sensitive information.\nDistribution is restricted to named recipients only.`
          ),
        ),
      ),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2 — TABLE OF CONTENTS
  // ════════════════════════════════════════════════════════════════════════════

  const tocEntries = [
    { num: '01', name: 'Executive Summary', desc: 'Strategic overview of AI environmental footprint, key performance indicators, and the business case for measurement.' },
    { num: '02', name: 'AI Usage Profile', desc: 'Detailed account of AI systems measured, providers connected, model inventory, and data collection methodology.' },
    { num: '03', name: 'Model Efficiency Analysis', desc: 'Scoring framework, frontier vs efficient model utilisation, task clustering, and mismatch analysis.' },
    { num: '04', name: 'Carbon & Water Footprint', desc: 'Quantified environmental impact, period-on-period comparisons, savings potential, and scientific methodology.' },
    { num: '05', name: 'Licensing Intelligence', desc: 'Seat utilisation analysis, cost optimisation opportunities, dormant licences, and renewal planning.' },
    { num: '06', name: 'Incentives & Global Financial Benefits', desc: 'International grants, tax credits, regulatory compliance obligations, and ESG index inclusion benefits.' },
    { num: '07', name: 'Hype Cycle & Benchmark Analysis', desc: 'Gartner Hype Cycle context for GenAI, first-mover advantage positioning, and peer benchmarking.' },
    { num: '08', name: 'Strategic Decisions & Recommendations', desc: 'Prioritised action plan with business impact, mitigation strategies, and implementation roadmap.' },
    { num: '09', name: 'ESG Disclosure Statement', desc: 'Formal disclosure aligned to CSRD, GRI 305, IFRS S2, and CDP frameworks, with methodology attestations.' },
  ]

  const TocPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.tocTitle }, 'Table of Contents'),
      React.createElement(Text, { style: styles.tocSubtitle },
        `${companyName}  ·  AI Environmental Impact Report  ·  ${reportingPeriod}`
      ),
      ...tocEntries.map(entry =>
        React.createElement(View, { key: entry.num, style: styles.tocRow },
          React.createElement(Text, { style: styles.tocNum }, entry.num),
          React.createElement(Text, { style: styles.tocName }, entry.name),
          React.createElement(Text, { style: styles.tocDesc }, entry.desc),
        )
      ),
      React.createElement(View, { style: { marginTop: 24, backgroundColor: BG_CARD, borderRadius: 5, padding: 14 } },
        React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 4 } },
          'About This Report'
        ),
        React.createElement(Text, { style: styles.bodyMuted },
          `This report was generated automatically by GreenLens AI on ${today}, drawing on live usage data from connected AI provider admin APIs. All carbon and water estimates are derived from publicly available energy intensity figures for frontier AI models and third-party data centre infrastructure. No individual employee usage data, prompt content, or personally identifiable information is captured, processed, or reported at any point. This document is intended for leadership and ESG disclosure purposes and should be treated as commercially confidential.`
        ),
      ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 3-4 — EXECUTIVE SUMMARY
  // ════════════════════════════════════════════════════════════════════════════

  const execNarrativeText = geminiNarrative ||
    narrative ||
    `The chart above compares ${companyName}'s AI carbon usage (${carbonKg != null ? `${fmt(carbonKg)} kg CO₂e` : 'current period'}) and water usage (${waterLiters != null ? `${fmt(waterLiters)} litres` : 'current period'}) against the prior period. ${prevCarbon != null && carbonKg != null && carbonKg < prevCarbon ? 'Carbon usage has decreased period-on-period, indicating progress.' : prevCarbon != null && carbonKg != null ? 'Carbon usage has increased, requiring attention.' : 'Establishing this baseline enables future trend tracking.'}\n\nSuggestion: Prioritise task-appropriate model selection to reduce frontier model overuse (efficiency score: ${effScore != null ? `${fmt(effScore)}/100` : 'measured'}, licence utilisation: ${utilRate != null ? pct(utilRate) : 'measured'}). Shifting routine tasks to efficient-tier models can cut carbon output 20–40% with no capability loss.`

  const globalNarrativeText = geminiGlobal ||
    `Global regulators now mandate AI environmental disclosure. The table below summarises the key frameworks — including penalties for non-compliance and financial incentives available to organisations with documented sustainability data.`

  const CarbonWaterComparisonChart = () => {
    const barW = (val: number | null, scale: number) => val != null ? Math.max(2, (val / scale) * 280) : 2
    const carbonScale = Math.max(carbonKg ?? 1, prevCarbon ?? 1, 1)
    const waterScale = Math.max((waterLiters ?? 1) / 1000, (prevWater ?? 1) / 1000, 1)
    return React.createElement(View, { style: { marginBottom: 12 } },
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4 } }, 'Period-on-Period Comparison'),
      React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
        { width: 460, height: 90, viewBox: '0 0 460 90' },
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
          { x: 0, y: 0, width: 460, height: 90, fill: BG_CARD }
        ),
        React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
          { x: 8, y: 16, fontSize: 7, fill: MUTED }, 'CARBON (kg CO₂e)'
        ),
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
          { x: 8, y: 20, width: barW(carbonKg, carbonScale), height: 10, fill: GREEN, rx: 2 }
        ),
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
          { x: 8, y: 32, width: barW(prevCarbon, carbonScale), height: 10, fill: RULE_COLOR, rx: 2 }
        ),
        React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
          { x: barW(carbonKg, carbonScale) + 12, y: 29, fontSize: 7, fill: GREEN },
          carbonKg != null ? `${fmt(carbonKg)} kg  (current)` : '—'
        ),
        React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
          { x: barW(prevCarbon, carbonScale) + 12, y: 41, fontSize: 7, fill: MUTED },
          prevCarbon != null ? `${fmt(prevCarbon)} kg  (prior)` : '—'
        ),
        React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
          { x: 8, y: 58, fontSize: 7, fill: MUTED }, 'WATER (litres)'
        ),
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
          { x: 8, y: 62, width: barW(waterLiters != null ? waterLiters / 1000 : null, waterScale), height: 10, fill: GREEN_LIGHT, rx: 2 }
        ),
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
          { x: 8, y: 74, width: barW(prevWater != null ? prevWater / 1000 : null, waterScale), height: 10, fill: RULE_COLOR, rx: 2 }
        ),
        React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
          { x: barW(waterLiters != null ? waterLiters / 1000 : null, waterScale) + 12, y: 71, fontSize: 7, fill: GREEN_LIGHT },
          waterLiters != null ? `${fmt(waterLiters)} L  (current)` : '—'
        ),
        React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
          { x: barW(prevWater != null ? prevWater / 1000 : null, waterScale) + 12, y: 83, fontSize: 7, fill: MUTED },
          prevWater != null ? `${fmt(prevWater)} L  (prior)` : '—'
        ),
      )
    )
  }

  const ExecSummaryPage1 = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '01',
        title: 'Executive Summary',
        lead: `Strategic overview of ${companyName}'s AI environmental footprint and the financial case for action.`,
      }),
      React.createElement(View, { style: styles.statRow },
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'AI Carbon Usage'),
          React.createElement(Text, { style: styles.statValue }, carbonKg != null ? fmt(carbonKg) : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'kg CO₂e'),
          prevCarbon != null && carbonKg != null
            ? React.createElement(Text, { style: styles.statDelta }, delta(carbonKg, prevCarbon))
            : null,
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'AI Water Usage'),
          React.createElement(Text, { style: styles.statValue }, waterLiters != null ? fmt(waterLiters) : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'litres'),
          prevWater != null && waterLiters != null
            ? React.createElement(Text, { style: styles.statDelta }, delta(waterLiters, prevWater))
            : null,
        ),
        React.createElement(View, { style: styles.statCardAlt },
          React.createElement(Text, { style: styles.statLabel }, 'Efficiency Score'),
          React.createElement(Text, { style: styles.statValueAlt }, effScore != null ? fmt(effScore) : '—'),
          React.createElement(Text, { style: styles.statUnit }, '/ 100'),
          prevEffScore != null && effScore != null
            ? React.createElement(Text, { style: { fontSize: 8, color: GREEN_LIGHT, marginTop: 3 } }, delta(effScore, prevEffScore))
            : null,
        ),
        React.createElement(View, { style: styles.statCardAlt },
          React.createElement(Text, { style: styles.statLabel }, 'Licence Util.'),
          React.createElement(Text, { style: styles.statValueAlt }, utilRate != null ? `${fmt(utilRate, 1)}%` : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'of seats active'),
        ),
      ),
      React.createElement(CarbonWaterComparisonChart, null),
      ...execNarrativeText.split('\n\n').filter(Boolean).slice(0, 2).map((para: string, i: number) =>
        React.createElement(Text, { key: `exec-para-${i}`, style: styles.bodyMuted }, para.trim())
      ),
      React.createElement(View, { style: styles.itemCardAccent },
        React.createElement(Text, { style: styles.itemSubtitle }, 'Key Suggestion'),
        React.createElement(Text, { style: styles.itemBody },
          `Shift routine AI tasks from frontier to efficient-tier models. This single action can reduce carbon output by 20–40% and lower licence costs without impacting capability.`
        ),
      ),
      React.createElement(Footer, null),
    )

  const ExecSummaryPage2 = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Subheading, null, 'Rebates, Incentives & Compliance Penalties'),
      React.createElement(Text, { style: styles.bodyMuted },
        `Documented AI sustainability data unlocks financial incentives and ensures regulatory compliance. The table below summarises key frameworks and their financial impact.`
      ),
      React.createElement(View, { style: { ...styles.tableHeader, marginTop: 6 } },
        React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 2 } }, 'Framework / Scheme'),
        React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1.5 } }, 'Jurisdiction'),
        React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 2 } }, 'Value / Penalty'),
      ),
      ...[
        { name: 'EU CSRD', jurisdiction: 'European Union', value: 'Penalty up to €10M / 2.5% turnover' },
        { name: 'US Inflation Reduction Act', jurisdiction: 'United States', value: '30% Investment Tax Credit' },
        { name: 'UK HMRC R&D Tax Relief', jurisdiction: 'United Kingdom', value: 'Up to 33% relief (SME)' },
        { name: 'Singapore EDG / Green Lane', jurisdiction: 'Singapore', value: 'Up to 70% co-funding' },
        { name: 'Germany KfW / France CIR', jurisdiction: 'EU Members', value: '25–50% project cost grants' },
      ].map((row, i) =>
        React.createElement(View, { key: `reg-${i}`, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
          React.createElement(Text, { style: { ...styles.tableCell, flex: 2 } }, row.name),
          React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1.5 } }, row.jurisdiction),
          React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 2 } }, row.value),
        )
      ),
      React.createElement(Subheading, null, 'Key Mitigation Strategies'),
      ...(mitigations.length > 0
        ? mitigations.slice(0, 4).map((m: unknown, i: number) => {
            const mit = m as Json
            const title = str(mit.title ?? mit.strategy ?? mit.action ?? '')
            const timeline = str((mit.timeline ?? mit.timeframe ?? mit.period ?? '') as string)
            return React.createElement(View, { key: `mit-${i}`, style: { ...styles.itemCard, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' } },
              React.createElement(Text, { style: { ...styles.itemTitle, flex: 1 } }, title || str(m)),
              timeline
                ? React.createElement(View, { style: { ...styles.frameworkBadge, marginLeft: 8 } },
                    React.createElement(Text, { style: styles.frameworkText }, timeline),
                  )
                : null,
            )
          })
        : [React.createElement(View, { key: 'mit-default', style: styles.itemCard },
            React.createElement(Text, { style: styles.itemBody },
              'Task-appropriate model selection · Quarterly licence audit · Sustainability grant applications · Internal AI carbon budgets'
            ),
          )]
      ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 5 — AI USAGE PROFILE
  // ════════════════════════════════════════════════════════════════════════════

  const UsageProfilePage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '02',
        title: 'AI Usage Profile',
        lead: 'What was measured, which systems were connected, and how usage data was collected.',
      }),
      React.createElement(BodyText, null,
        `GreenLens AI measures organisational AI consumption through direct integration with provider admin APIs: the same interfaces used by IT administrators to manage seats, monitor usage volumes, and review billing. This approach captures usage at the aggregate, organisational level without accessing any individual employee's prompts, outputs, or personal data. The measurement framework covers all major frontier AI providers connected to ${companyName}'s account and normalises raw usage signals (token counts, API call volumes, model identifiers) into standardised energy and environmental metrics using peer-reviewed energy intensity coefficients.`
      ),
      React.createElement(BodyText, null,
        `Data for this report covers the period ${reportingPeriod}${freshness ? `, with the most recent complete day of data being ${freshness}` : ''}. The reporting window is aligned to ${companyName}'s operational calendar to ensure comparability with internal cost-centre reporting and to support the period-on-period benchmarking that underpins trend analysis. Where partial-period data exists (for example, where a provider integration was added mid-period) GreenLens AI applies a clearly documented proration methodology to ensure figures are representative and not artificially deflated by coverage gaps.`
      ),
      React.createElement(BodyText, null,
        `The model inventory below reflects every distinct AI model identifier detected in usage records during the reporting period. Models are classified by capability tier: Frontier (state-of-the-art reasoning and multimodal models), Efficient (optimised models with lower energy overhead), and Specialised (domain-specific or fine-tuned models). This classification enables the task-to-capability alignment analysis presented in Section 03. Frontier model usage accounted for ${frontierPct != null ? `${fmt(frontierPct, 1)}%` : 'a significant proportion'} of total consumption during this period.`
      ),
      inventory.length > 0
        ? React.createElement(View, null,
            React.createElement(Subheading, null, 'Detected Model Inventory'),
            React.createElement(View, { style: styles.tableHeader },
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 3 } }, 'Model Identifier'),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1 } }, 'Provider'),
            ),
            ...inventory.slice(0, 10).map((m: unknown, i: number) => {
              const model = m as Json
              const modelId = normalizeProviderName(str(model.model ?? model.model_id ?? model.name ?? `Model ${i + 1}`))
              const provider = normalizeProviderName(str(model.provider ?? model.vendor ?? ''))
              return React.createElement(View, { key: `model-${i}`, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
                React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, modelId),
                React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1 } }, provider || '—'),
              )
            }),
          )
        : React.createElement(View, { style: styles.itemCard },
            React.createElement(Text, { style: styles.itemBody },
              'Model inventory data will be populated once provider integrations are fully connected and a complete analysis cycle has been run. Connect your AI provider admin accounts via the GreenLens AI dashboard to enable this section.'
            ),
          ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 6 — MODEL EFFICIENCY ANALYSIS
  // ════════════════════════════════════════════════════════════════════════════

  const ModelEfficiencyChart = () => {
    const scoreBarW = effScore != null ? Math.max(2, (effScore / 100) * 300) : 2
    const benchmarkX = (75 / 100) * 300
    const frontierBarW = frontierPct != null ? Math.max(2, (frontierPct / 100) * 300) : 2
    const efficientBarW = frontierPct != null ? Math.max(2, ((100 - frontierPct) / 100) * 300) : 2
    const mismatchBarW = mismatchRate != null ? Math.max(2, (mismatchRate / 100) * 300) : 2
    const targetMismatchX = (10 / 100) * 300
    return React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
      { width: 460, height: 130, viewBox: '0 0 460 130' },
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
        { x: 0, y: 0, width: 460, height: 130, fill: BG_CARD }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 8, y: 16, fontSize: 7, fill: MUTED }, 'EFFICIENCY SCORE  (benchmark: 75/100)'
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 20, width: 300, height: 12, fill: RULE_COLOR, rx: 3 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 20, width: scoreBarW, height: 12, fill: GREEN, rx: 3 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
        { x: 8 + benchmarkX, y: 18, width: 2, height: 16, fill: DARK }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 318, y: 30, fontSize: 8, fill: GREEN },
        effScore != null ? `${fmt(effScore)}/100` : '—'
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 8, y: 52, fontSize: 7, fill: MUTED }, 'MODEL MIX  (frontier vs efficient)'
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 56, width: frontierBarW, height: 12, fill: '#c0392b', rx: 3 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8 + frontierBarW, y: 56, width: efficientBarW, height: 12, fill: GREEN_LIGHT, rx: 3 }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 318, y: 66, fontSize: 8, fill: MUTED },
        frontierPct != null ? `${fmt(frontierPct, 1)}% frontier` : '—'
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 8, y: 86, fontSize: 7, fill: MUTED }, 'TASK MISMATCH RATE  (target: <10%)'
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 90, width: 300, height: 12, fill: RULE_COLOR, rx: 3 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 90, width: mismatchBarW, height: 12, fill: '#e67e22', rx: 3 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
        { x: 8 + targetMismatchX, y: 88, width: 2, height: 16, fill: DARK }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 318, y: 100, fontSize: 8, fill: MUTED },
        mismatchRate != null ? `${fmt(mismatchRate, 1)}%` : '—'
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
        { x: 8, y: 116, width: 8, height: 8, fill: DARK }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 20, y: 123, fontSize: 6.5, fill: MUTED }, 'Benchmark / Target'
      ),
    )
  }

  const ModelEfficiencyPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '03',
        title: 'Model Efficiency Analysis',
        lead: 'Efficiency scoring, model mix, and task-mismatch comparison.',
      }),
      React.createElement(View, { style: styles.statRow },
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Efficiency Score'),
          React.createElement(Text, { style: styles.statValue }, effScore != null ? `${fmt(effScore)}/100` : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'composite score'),
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Frontier Model Usage'),
          React.createElement(Text, { style: styles.statValue }, frontierPct != null ? `${fmt(frontierPct, 1)}%` : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'of total volume'),
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Task Mismatch Rate'),
          React.createElement(Text, { style: styles.statValue }, mismatchRate != null ? `${fmt(mismatchRate, 1)}%` : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'over-specified tasks'),
        ),
      ),
      React.createElement(ModelEfficiencyChart, null),
      React.createElement(Text, { style: styles.bodyMuted },
        `The chart compares the current efficiency score against the 75/100 benchmark, shows the frontier-to-efficient model mix, and highlights task mismatch rate against the <10% target.${effScore != null && effScore < 75 ? ' The score is below benchmark — shifting routine tasks to efficient models will close this gap.' : effScore != null ? ' The score meets or exceeds benchmark — maintain current model selection discipline.' : ''}`
      ),
      React.createElement(View, { style: styles.itemCardAccent },
        React.createElement(Text, { style: styles.itemSubtitle }, 'Impact & Suggestion'),
        React.createElement(Text, { style: styles.itemBody },
          `${mismatchRate != null && mismatchRate > 10 ? `${fmt(mismatchRate, 1)}% of tasks use over-specified models, inflating carbon and cost. ` : ''}Routing low-complexity tasks to efficient-tier models can improve the efficiency score by 10–25 points and reduce energy consumption proportionally.`
        ),
      ),
      mismatchedClusters.length > 0
        ? React.createElement(View, null,
            React.createElement(Subheading, null, 'Mismatched Usage Clusters'),
            ...mismatchedClusters.slice(0, 4).map((c: unknown, i: number) => {
              const cluster = c as Json
              return React.createElement(View, { key: `cluster-${i}`, style: { ...styles.itemCard, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
                React.createElement(Text, { style: { ...styles.itemTitle, flex: 1, marginBottom: 0 } },
                  str(cluster.cluster_name ?? cluster.name ?? `Cluster ${i + 1}`)
                ),
                React.createElement(Text, { style: styles.impactBadge }, 'Over-specified'),
              )
            }),
          )
        : null,
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 7 — CARBON & WATER FOOTPRINT
  // ════════════════════════════════════════════════════════════════════════════

  const FootprintComparisonChart = () => {
    const carbonMax = Math.max(carbonKg ?? 0, prevCarbon ?? 0, altCarbon ?? 0, 1)
    const waterMax = Math.max(waterLiters ?? 0, prevWater ?? 0, 1)
    const BAR_AREA = 260
    const cBar = (v: number | null) => v != null ? Math.max(2, (v / carbonMax) * BAR_AREA) : 2
    const wBar = (v: number | null) => v != null ? Math.max(2, (v / waterMax) * BAR_AREA) : 2
    const rows = altCarbon != null ? 3 : 2
    const height = 16 + rows * 14 + 60
    return React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
      { width: 460, height: height, viewBox: `0 0 460 ${height}` },
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
        { x: 0, y: 0, width: 460, height: height, fill: BG_CARD }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 8, y: 14, fontSize: 7, fill: MUTED }, 'CARBON FOOTPRINT (kg CO₂e)'
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 18, width: cBar(carbonKg), height: 11, fill: GREEN, rx: 2 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: 31, width: cBar(prevCarbon), height: 11, fill: RULE_COLOR, rx: 2 }
      ),
      altCarbon != null
        ? React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
            { x: 8, y: 44, width: cBar(altCarbon), height: 11, fill: GREEN_LIGHT, rx: 2 }
          )
        : null,
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: cBar(carbonKg) + 12, y: 27, fontSize: 7, fill: GREEN },
        carbonKg != null ? `${fmt(carbonKg)} kg  (current)` : '—'
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: cBar(prevCarbon) + 12, y: 40, fontSize: 7, fill: MUTED },
        prevCarbon != null ? `${fmt(prevCarbon)} kg  (prior)` : '—'
      ),
      altCarbon != null
        ? React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
            { x: cBar(altCarbon) + 12, y: 53, fontSize: 7, fill: GREEN_LIGHT },
            `${fmt(altCarbon)} kg  (optimised potential)`
          )
        : null,
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: 8, y: height - 46, fontSize: 7, fill: MUTED }, 'WATER CONSUMPTION (litres)'
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: height - 42, width: wBar(waterLiters), height: 11, fill: GREEN_LIGHT, rx: 2 }
      ),
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
        { x: 8, y: height - 29, width: wBar(prevWater), height: 11, fill: RULE_COLOR, rx: 2 }
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: wBar(waterLiters) + 12, y: height - 33, fontSize: 7, fill: GREEN_LIGHT },
        waterLiters != null ? `${fmt(waterLiters)} L  (current)` : '—'
      ),
      React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
        { x: wBar(prevWater) + 12, y: height - 20, fontSize: 7, fill: MUTED },
        prevWater != null ? `${fmt(prevWater)} L  (prior)` : '—'
      ),
    )
  }

  const CarbonByModelChart = () => {
    const top6 = carbonByModel.slice(0, 6).map((m: unknown) => {
      const entry = m as Json
      const modelName = normalizeProviderName(str(entry.model ?? entry.model_id ?? entry.name ?? 'Unknown'))
      const carbon = (entry.carbon_kg ?? entry.carbon) as number | null
      return { modelName: modelName.length > 24 ? modelName.substring(0, 22) + '…' : modelName, carbon: carbon ?? 0 }
    })
    const maxCarbon = Math.max(...top6.map(m => m.carbon), 1)
    const BAR_W = 260
    const svgHeight = top6.length * 24 + 16
    return React.createElement(View, { style: { marginBottom: 8 } },
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4 } }, 'Carbon by Model (kg CO₂e)'),
      React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
        { width: 460, height: svgHeight, viewBox: `0 0 460 ${svgHeight}` },
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
          { x: 0, y: 0, width: 460, height: svgHeight, fill: BG_CARD }
        ),
        ...top6.flatMap(({ modelName, carbon }, i) => {
          const bw = Math.max(4, (carbon / maxCarbon) * BAR_W)
          const y = 10 + i * 24
          return [
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
              { key: `cm-lbl-${i}`, x: 8, y: y, fontSize: 7, fill: DARK }, modelName
            ),
            React.createElement(Rect as unknown as React.ComponentType<{ key?: string; x: number; y: number; width: number; height: number; fill: string; rx: number }>,
              { key: `cm-bar-${i}`, x: 8, y: y + 3, width: bw, height: 10, fill: i === 0 ? GREEN : GREEN_LIGHT, rx: 2 }
            ),
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
              { key: `cm-val-${i}`, x: bw + 14, y: y + 11, fontSize: 7, fill: MUTED }, `${fmt(carbon, 2)} kg`
            ),
          ]
        }),
      ),
    )
  }

  const FootprintPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '04',
        title: 'Carbon & Water Footprint',
        lead: 'Period-on-period comparison, per-model breakdown, and savings potential.',
      }),
      React.createElement(View, { style: styles.statRow },
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Total Carbon'),
          React.createElement(Text, { style: styles.statValue }, carbonKg != null ? fmt(carbonKg) : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'kg CO₂e'),
          prevCarbon != null && carbonKg != null
            ? React.createElement(Text, { style: styles.statDelta }, delta(carbonKg, prevCarbon))
            : null,
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Total Water'),
          React.createElement(Text, { style: styles.statValue }, waterLiters != null ? fmt(waterLiters) : '—'),
          React.createElement(Text, { style: styles.statUnit }, 'litres'),
          prevWater != null && waterLiters != null
            ? React.createElement(Text, { style: styles.statDelta }, delta(waterLiters, prevWater))
            : null,
        ),
        altCarbon != null
          ? React.createElement(View, { style: styles.statCardAlt },
              React.createElement(Text, { style: styles.statLabel }, 'Optimised Footprint'),
              React.createElement(Text, { style: styles.statValueAlt }, fmt(altCarbon)),
              React.createElement(Text, { style: styles.statUnit }, 'kg CO₂e potential'),
            )
          : null,
        carbonSavings != null
          ? React.createElement(View, { style: styles.statCardAlt },
              React.createElement(Text, { style: styles.statLabel }, 'Savings Potential'),
              React.createElement(Text, { style: styles.statValueAlt }, fmt(carbonSavings)),
              React.createElement(Text, { style: styles.statUnit }, 'kg CO₂e reachable'),
            )
          : null,
      ),
      React.createElement(FootprintComparisonChart, null),
      React.createElement(Text, { style: styles.bodyMuted },
        `The chart compares current carbon and water usage against the prior period.${carbonSavings != null ? ` Optimising model selection could save ${fmt(carbonSavings)} kg CO₂e.` : ''}${prevCarbon != null && carbonKg != null && carbonKg < prevCarbon ? ' Carbon usage is trending downward — continue current optimisation efforts.' : prevCarbon != null && carbonKg != null ? ' Carbon usage increased — review frontier model allocation to reverse this trend.' : ''}`
      ),
      carbonByModel.length > 0
        ? React.createElement(CarbonByModelChart, null)
        : null,
      React.createElement(View, { style: styles.itemCardAccent },
        React.createElement(Text, { style: styles.itemSubtitle }, 'Impact & Suggestion'),
        React.createElement(Text, { style: styles.itemBody },
          `${altCarbon != null && carbonKg != null ? `Switching to optimised model selection reduces carbon from ${fmt(carbonKg)} to ${fmt(altCarbon)} kg CO₂e. ` : ''}Prioritise high-carbon models for replacement with efficient alternatives to achieve the largest environmental and cost benefit.`
        ),
      ),
      esgCarbonMethod || esgWaterMethod
        ? React.createElement(View, { style: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: RULE_COLOR } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, marginBottom: 2 } }, 'Methodology'),
            esgCarbonMethod
              ? React.createElement(Text, { style: { fontSize: 7, color: MUTED, lineHeight: 1.4 } }, `Carbon: ${esgCarbonMethod.substring(0, 200)}${esgCarbonMethod.length > 200 ? '…' : ''}`)
              : null,
            esgWaterMethod
              ? React.createElement(Text, { style: { fontSize: 7, color: MUTED, lineHeight: 1.4, marginTop: 2 } }, `Water: ${esgWaterMethod.substring(0, 200)}${esgWaterMethod.length > 200 ? '…' : ''}`)
              : null,
          )
        : null,
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 8 — LICENSING INTELLIGENCE
  // ════════════════════════════════════════════════════════════════════════════

  const LicensingPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '05',
        title: 'Licensing Intelligence',
        lead: 'Seat utilisation, cost optimisation, dormant licences, and renewal planning.',
      }),
      React.createElement(View, { style: styles.statRow },
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Total Licensed Seats'),
          React.createElement(Text, { style: styles.statValue }, totalSeats != null ? fmt(totalSeats) : '—'),
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Active Seats'),
          React.createElement(Text, { style: styles.statValue }, activeSeats != null ? fmt(activeSeats) : '—'),
        ),
        React.createElement(View, { style: styles.statCard },
          React.createElement(Text, { style: styles.statLabel }, 'Dormant Seats'),
          React.createElement(Text, { style: styles.statValue }, dormantSeats != null ? fmt(dormantSeats) : '—'),
        ),
        React.createElement(View, { style: styles.statCardAlt },
          React.createElement(Text, { style: styles.statLabel }, 'Annual Cost'),
          React.createElement(Text, { style: styles.statValueAlt }, annualCost != null ? fmtCurrency(annualCost) : '—'),
        ),
      ),
      React.createElement(Text, { style: styles.bodyMuted },
        `${totalSeats != null ? `${fmt(totalSeats)} licensed seats` : 'Licensed seats'} across providers, ${activeSeats != null ? `${fmt(activeSeats)} active` : 'a portion active'}, ${dormantSeats != null ? `${fmt(dormantSeats)} dormant` : 'remainder dormant'}. Rationalising dormant seats at renewal saves ${annualSavings != null ? fmtCurrency(annualSavings) : 'a material amount'} annually. Utilisation data also separates licensed capacity from actual consumption for accurate ESG carbon attribution.`
      ),
      annualCost != null
        ? (() => {
            const optimised = annualSavings != null ? annualCost - annualSavings : annualCost * 0.75
            const maxCost = Math.max(annualCost, 1)
            const BAR_W = 280
            return React.createElement(View, { style: { marginBottom: 10 } },
              React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4 } }, 'Licence Cost Savings Opportunity'),
              React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
                { width: 460, height: 70, viewBox: '0 0 460 70' },
                React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
                  { x: 0, y: 0, width: 460, height: 70, fill: BG_CARD }
                ),
                React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
                  { x: 8, y: 14, fontSize: 7, fill: MUTED }, 'CURRENT ANNUAL COST'
                ),
                React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
                  { x: 8, y: 18, width: Math.max(4, (annualCost / maxCost) * BAR_W), height: 12, fill: '#c0392b', rx: 2 }
                ),
                React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
                  { x: Math.max(4, (annualCost / maxCost) * BAR_W) + 14, y: 28, fontSize: 8, fill: DARK }, fmtCurrency(annualCost)
                ),
                React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
                  { x: 8, y: 46, fontSize: 7, fill: MUTED }, 'OPTIMISED COST (after rationalisation)'
                ),
                React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string; rx: number }>,
                  { x: 8, y: 50, width: Math.max(4, (optimised / maxCost) * BAR_W), height: 12, fill: GREEN, rx: 2 }
                ),
                React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string }>,
                  { x: Math.max(4, (optimised / maxCost) * BAR_W) + 14, y: 60, fontSize: 8, fill: GREEN },
                  `${fmtCurrency(optimised)}  (save ${annualSavings != null ? fmtCurrency(annualSavings) : fmtCurrency(annualCost * 0.25)}/yr)`
                ),
              ),
            )
          })()
        : null,
      providers.length > 0
        ? React.createElement(View, null,
            React.createElement(Subheading, null, 'Provider Breakdown'),
            React.createElement(View, { style: styles.tableHeader },
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 2 } }, 'Provider'),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1 } }, 'Seats'),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1 } }, 'Active'),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1 } }, 'Util. %'),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1.5 } }, 'Annual Cost'),
              React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1.5 } }, 'Savings Potential'),
            ),
            ...providers.slice(0, 8).map((p: unknown, i: number) => {
              const prov = p as Json
              const pName = normalizeProviderName(str(prov.provider ?? prov.name ?? `Provider ${i + 1}`))
              const seats = (prov.totalSeats ?? prov.total_seats) as number | null
              const active = (prov.activeSeats ?? prov.active_seats) as number | null
              const utilR = (prov.utilizationRate ?? prov.utilization_rate) as number | null
              const cost = (prov.estimatedAnnualCost ?? prov.estimated_annual_cost) as number | null
              const savings = (prov.potentialSavingsAtRenewal ?? prov.potential_savings) as number | null
              return React.createElement(View, { key: `prov-${i}`, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
                React.createElement(Text, { style: { ...styles.tableCell, flex: 2 } }, pName),
                React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1 } }, seats != null ? fmt(seats) : '—'),
                React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1 } }, active != null ? fmt(active) : '—'),
                React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1 } }, utilR != null ? `${fmt(utilR, 1)}%` : '—'),
                React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1.5 } }, cost != null ? fmtCurrency(cost) : '—'),
                React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1.5 } }, savings != null ? fmtCurrency(savings) : '—'),
              )
            }),
          )
        : null,
      renewalAlerts.length > 0
        ? React.createElement(View, null,
            React.createElement(Subheading, null, 'Upcoming Renewal Alerts'),
            ...renewalAlerts.slice(0, 4).map((a: unknown, i: number) => {
              const alert = a as Json
              return React.createElement(View, { key: `alert-${i}`, style: styles.itemCardAccent },
                React.createElement(Text, { style: styles.itemTitle },
                  `${normalizeProviderName(str(alert.provider))}  ·  Renewal in ${str(alert.monthsToRenewal)} months (${str(alert.renewalDate)})`
                ),
                React.createElement(Text, { style: styles.itemBody }, str(alert.actionRequired)),
              )
            }),
          )
        : null,
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 9 — INCENTIVES & GLOBAL FINANCIAL BENEFITS
  // ════════════════════════════════════════════════════════════════════════════

  function parseIncentiveValue(valStr: string): number {
    if (!valStr) return 0
    const m = valStr.match(/[\d,]+(?:\.\d+)?/)
    if (!m) return 0
    return parseFloat(m[0].replace(/,/g, ''))
  }

  const IncentivesValueChart = () => {
    const top5 = allIncentives.slice(0, 5).map((item: unknown) => {
      const inc = item as Json
      const name = str(inc.name ?? inc.title ?? inc.incentive).split('—')[0].trim().substring(0, 30)
      const jurisdiction = str(inc.jurisdiction ?? inc.region ?? inc.country).substring(0, 12)
      const valStr = str(inc.value ?? inc.amount ?? inc.benefit ?? inc.estimated_value)
      const numVal = parseIncentiveValue(valStr)
      return { name, jurisdiction, valStr, numVal }
    })
    const maxVal = Math.max(...top5.map(i => i.numVal), 1)
    const BAR_W = 240
    const svgHeight = top5.length * 26 + 20
    return React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
      { width: 460, height: svgHeight, viewBox: `0 0 460 ${svgHeight}` },
      React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
        { x: 0, y: 0, width: 460, height: svgHeight, fill: BG_CARD }
      ),
      ...top5.flatMap(({ name, jurisdiction, valStr, numVal }, i) => {
        const bw = numVal > 0 ? Math.max(4, (numVal / maxVal) * BAR_W) : 4
        const y = 14 + i * 26
        return [
          React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
            { key: `in-name-${i}`, x: 8, y: y - 2, fontSize: 7, fill: DARK },
            `${name}  (${jurisdiction})`
          ),
          React.createElement(Rect as unknown as React.ComponentType<{ key?: string; x: number; y: number; width: number; height: number; fill: string; rx: number }>,
            { key: `in-bar-${i}`, x: 8, y: y + 2, width: bw, height: 10, fill: GREEN, rx: 2 }
          ),
          React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
            { key: `in-val-${i}`, x: bw + 14, y: y + 10, fontSize: 7, fill: MUTED },
            valStr.length > 35 ? valStr.substring(0, 35) + '…' : valStr
          ),
        ]
      }),
    )
  }

  const defaultIncentives = [
    { name: 'EU CSRD — Mandatory Compliance', jurisdiction: 'European Union', value: 'Penalty avoidance up to €10M / 2.5% turnover' },
    { name: 'EU AI Act — Environmental Provisions', jurisdiction: 'European Union', value: 'Compliance evidence for regulatory clearance' },
    { name: 'US Inflation Reduction Act (IRA)', jurisdiction: 'United States', value: '30% ITC on qualifying capital expenditure' },
    { name: 'UK HMRC R&D Tax Relief', jurisdiction: 'United Kingdom', value: 'Up to 33% relief for SMEs; 20% RDEC' },
    { name: 'Singapore EDG & Green Lane', jurisdiction: 'Singapore', value: 'Up to 70% co-funding via EDG' },
    { name: 'Japan Green Innovation Fund', jurisdiction: 'Japan', value: 'Grant access via METI GX programme' },
    { name: 'France CIR', jurisdiction: 'France', value: '30–50% tax credit on eligible R&D' },
    { name: 'Germany KfW Green Grants', jurisdiction: 'Germany', value: '25–50% of eligible project costs' },
    { name: 'Canada Clean Tech ITC', jurisdiction: 'Canada', value: '30% refundable ITC' },
    { name: 'Australia CEFC Financing', jurisdiction: 'Australia', value: 'Concessional financing up to 100%' },
  ]

  const allIncentives = incentiveList.length > 0 ? incentiveList : defaultIncentives

  const IncentivesPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '06',
        title: 'Incentives & Global Financial Benefits',
        lead: 'Available grants, tax credits, and compliance incentives for organisations with documented AI sustainability data.',
      }),
      React.createElement(Text, { style: styles.bodyMuted },
        `Documented AI sustainability data unlocks grants, tax credits, and ESG index inclusion benefits globally. The chart and table below highlight the highest-value programmes applicable to ${companyName}.`
      ),
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4, marginTop: 8 } }, 'Top Incentives by Financial Value'),
      React.createElement(IncentivesValueChart, null),
      React.createElement(View, { style: { marginTop: 10 } },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 3 } }, 'Programme'),
          React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 1.5 } }, 'Jurisdiction'),
          React.createElement(Text, { style: { ...styles.tableHeaderCell, flex: 2 } }, 'Value'),
        ),
        ...allIncentives.slice(0, 6).map((item: unknown, i: number) => {
          const inc = item as Json
          const name = str(inc.name ?? inc.title ?? inc.incentive) || `Incentive ${i + 1}`
          const value = str(inc.value ?? inc.amount ?? inc.benefit ?? inc.estimated_value)
          const jurisdiction = str(inc.jurisdiction ?? inc.region ?? inc.country)
          return React.createElement(View, { key: `inc-${i}`, style: i % 2 === 0 ? styles.tableRow : styles.tableRowAlt },
            React.createElement(Text, { style: { ...styles.tableCell, flex: 3 } }, name),
            React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 1.5 } }, jurisdiction || '—'),
            React.createElement(Text, { style: { ...styles.tableCellMuted, flex: 2 } }, value || '—'),
          )
        }),
      ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 10 — HYPE CYCLE & BENCHMARK ANALYSIS
  // ════════════════════════════════════════════════════════════════════════════

  const HypeCyclePage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '07',
        title: 'Hype Cycle & Benchmark Analysis',
        lead: 'Gartner positioning, first-mover advantage, and peer benchmarking for AI environmental data.',
      }),
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 8 } }, 'Gartner Hype Cycle: Current GenAI / LLM Position'),

      // ── Hype Cycle SVG chart ─────────────────────────────────────────────────
      // Viewbox: 500 × 220  (points: x from 0-500, y from 0-200 inverted)
      // Curve: Technology Trigger (x=40) → Peak (x=160,y=15) → Trough (x=280,y=165)
      //        → Slope (x=390,y=80) → Plateau (x=480,y=95)
      React.createElement(View, { style: { marginBottom: 14, alignItems: 'center' } },
        React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string; style?: object }>,
          { width: 450, height: 220, viewBox: '0 0 500 244' },

          // Background fill
          React.createElement(Path as unknown as React.ComponentType<{ d: string; fill: string; stroke?: string }>,
            { d: 'M0 0 H500 V244 H0 Z', fill: BG_CARD }
          ),

          // Y axis
          React.createElement(Line as unknown as React.ComponentType<{ x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number }>,
            { x1: 44, y1: 12, x2: 44, y2: 175, stroke: MUTED, strokeWidth: 1 }
          ),
          // X axis
          React.createElement(Line as unknown as React.ComponentType<{ x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number }>,
            { x1: 44, y1: 175, x2: 488, y2: 175, stroke: MUTED, strokeWidth: 1 }
          ),

          // Hype cycle curve (cubic bezier)
          // Stages: Trigger(x=70) Peak(x=160,y=18) Trough(x=270,y=158) Slope(x=380,y=72) Plateau(x=468,y=88)
          React.createElement(Path as unknown as React.ComponentType<{ d: string; fill: string; stroke: string; strokeWidth: number }>,
            {
              d: 'M 60 155 C 85 150 115 22 162 18 C 198 15 228 138 270 158 C 312 175 348 72 382 70 C 418 68 448 85 468 87',
              fill: 'none',
              stroke: '#c0392b',
              strokeWidth: 2.5,
            }
          ),

          // Tick marks below axis for each stage
          ...[70, 162, 270, 382, 468].map((x, i) =>
            React.createElement(Line as unknown as React.ComponentType<{ x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number }>,
              { key: `tk-${i}`, x1: x, y1: 175, x2: x, y2: 181, stroke: MUTED, strokeWidth: 1 }
            )
          ),

          // Stage labels
          ...[
            { x: 70,  l1: 'Technology', l2: 'Trigger',         green: false },
            { x: 162, l1: 'Peak of',    l2: 'Expectations',    green: false },
            { x: 270, l1: 'Trough of',  l2: 'Disillusionment', green: false },
            { x: 382, l1: 'Slope of',   l2: 'Enlightenment',   green: false },
            { x: 468, l1: 'Plateau of', l2: 'Productivity',    green: false },
          ].flatMap(({ x, l1, l2, green }, i) => [
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string; textAnchor?: string }>,
              { key: `la-${i}`, x, y: 191, fontSize: 5.5, fill: green ? GREEN : MUTED, textAnchor: 'middle' },
              l1
            ),
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string; textAnchor?: string }>,
              { key: `lb-${i}`, x, y: 201, fontSize: 5.5, fill: green ? GREEN : MUTED, textAnchor: 'middle' },
              l2
            ),
          ]),

          // "WE ARE HERE" marker — on the downturn between Peak and Trough
          React.createElement(Circle as unknown as React.ComponentType<{ cx: number; cy: number; r: number; fill: string; stroke: string; strokeWidth: number }>,
            { cx: 232, cy: 120, r: 5, fill: GREEN, stroke: WHITE, strokeWidth: 1.5 }
          ),
          React.createElement(Line as unknown as React.ComponentType<{ x1: number; y1: number; x2: number; y2: number; stroke: string; strokeWidth: number; strokeDasharray?: string }>,
            { x1: 232, y1: 114, x2: 232, y2: 90, stroke: GREEN, strokeWidth: 1, strokeDasharray: '3 2' }
          ),
          React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string; fontWeight?: string; textAnchor?: string }>,
            { x: 232, y: 86, fontSize: 6.5, fill: GREEN, fontWeight: 'bold', textAnchor: 'middle' },
            'WE ARE HERE'
          ),
          React.createElement(Text as unknown as React.ComponentType<{ x: number; y: number; fontSize: number; fill: string; textAnchor?: string }>,
            { x: 232, y: 215, fontSize: 5, fill: GREEN, textAnchor: 'middle' },
            '▲ Still descending'
          ),
        )
      ),

      // Stage pills
      React.createElement(View, { style: styles.hypePillRow },
        ...[
          { label: 'Technology Trigger', active: false },
          { label: 'Peak of Inflated Expectations', active: false },
          { label: 'Descending (Current)', active: true },
          { label: 'Trough of Disillusionment', active: false },
          { label: 'Slope of Enlightenment', active: false },
          { label: 'Plateau of Productivity', active: false },
        ].map(stage =>
          React.createElement(View, { key: stage.label, style: stage.active ? styles.hypePillActive : styles.hypePill },
            React.createElement(Text, { style: stage.active ? styles.hypePillTextActive : styles.hypePillText }, stage.label),
          )
        ),
      ),
      React.createElement(Text, { style: styles.bodyMuted },
        `GenAI peaked in expectations through 2022–2023. As of 2025–2026, the market is still on the downturn — we have not yet reached the Trough of Disillusionment. Enterprises are scrutinising AI ROI more rigorously and recalibrating from hype to evidence. The trough remains ahead, and the depth of the descent will depend on how quickly organisations adopt measurement discipline and demonstrate tangible returns.`
      ),
      React.createElement(Text, { style: styles.bodyMuted },
        `${companyName}'s benchmark: carbon efficiency at the ${carbonPct != null ? `${fmt(carbonPct)}th percentile` : 'measured percentile'} with a ${trendDir || 'current'} trend${anomaly === true ? ' (anomaly detected)' : ''}. Establishing measurement now — while still descending — positions the organisation to arrive at the Slope of Enlightenment (est. 2027–2029) with a multi-year baseline. First-mover advantage in AI environmental data is time-limited; early adopters define the benchmark others are measured against.`
      ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 11 — STRATEGIC DECISIONS & RECOMMENDATIONS
  // ════════════════════════════════════════════════════════════════════════════

  const defaultDecisions = [
    { title: 'Implement Task-Appropriate Model Selection Policy', impact: 'Estimated 20–40% reduction in AI energy consumption and licence cost.' },
    { title: 'Launch Quarterly AI Licence Audit Programme', impact: 'Reclaim estimated annual saving at next renewal cycle.' },
    { title: 'Register for International Incentive Programmes', impact: 'Material grant and tax credit value across eligible programmes.' },
    { title: 'Establish Internal AI Carbon Budget', impact: 'Structural behavioural change sustaining improvement long-term.' },
    { title: 'Prepare CSRD Double-Materiality Assessment', impact: 'Compliance readiness; penalty risk mitigation.' },
  ]

  const allDecisions = decisionList.length > 0 ? decisionList : defaultDecisions

  function parseImpactPercent(impactStr: string): number {
    const m = impactStr.match(/(\d+)[–-]?(\d+)?%/)
    if (m) return parseInt(m[2] ?? m[1], 10)
    if (/compliance|readiness|penalty/i.test(impactStr)) return 60
    if (/structural|behavioural/i.test(impactStr)) return 45
    if (/material|grant|saving/i.test(impactStr)) return 55
    return 40
  }

  const RecommendationsImpactChart = () => {
    const items = allDecisions.slice(0, 6).map((item: unknown) => {
      const d = item as Json
      const title = str(d.title ?? d.decision ?? d.action).substring(0, 40)
      const impact = str(d.impact ?? d.expectedImpact ?? d.expected_impact)
      const impactPct = parseImpactPercent(impact)
      return { title: title.length >= 40 ? title.substring(0, 38) + '…' : title, impact, impactPct }
    })
    const maxPct = Math.max(...items.map(i => i.impactPct), 1)
    const BAR_W = 220
    const svgHeight = items.length * 26 + 16
    return React.createElement(View, { style: { marginBottom: 10 } },
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4 } }, 'Estimated Impact by Recommendation'),
      React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
        { width: 460, height: svgHeight, viewBox: `0 0 460 ${svgHeight}` },
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
          { x: 0, y: 0, width: 460, height: svgHeight, fill: BG_CARD }
        ),
        ...items.flatMap(({ title, impact, impactPct }, i) => {
          const bw = Math.max(4, (impactPct / maxPct) * BAR_W)
          const y = 12 + i * 26
          return [
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
              { key: `ri-lbl-${i}`, x: 8, y: y, fontSize: 6.5, fill: DARK }, title
            ),
            React.createElement(Rect as unknown as React.ComponentType<{ key?: string; x: number; y: number; width: number; height: number; fill: string; rx: number }>,
              { key: `ri-bar-${i}`, x: 8, y: y + 3, width: bw, height: 10, fill: i === 0 ? GREEN : GREEN_LIGHT, rx: 2 }
            ),
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
              { key: `ri-val-${i}`, x: bw + 14, y: y + 11, fontSize: 6.5, fill: MUTED },
              impact.length > 50 ? impact.substring(0, 48) + '…' : impact
            ),
          ]
        }),
      ),
    )
  }

  const StrategicDecisionsPage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '08',
        title: 'Strategic Decisions & Recommendations',
        lead: `Prioritised recommendations derived from ${companyName}'s measured data, ordered by financial and environmental impact.`,
      }),
      React.createElement(Text, { style: styles.bodyMuted },
        `Each recommendation targets financial return, environmental improvement, and regulatory readiness within a 12-month horizon.`
      ),
      React.createElement(RecommendationsImpactChart, null),
      ...allDecisions.slice(0, 6).map((item: unknown, i: number) => {
        const d = item as Json
        const title  = str(d.title ?? d.decision ?? d.action) || `Recommendation ${i + 1}`
        const impact = str(d.impact ?? d.expectedImpact ?? d.expected_impact)
        return React.createElement(View, { key: `dec-${i}`, style: { ...styles.itemCard, paddingVertical: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement(View, { style: { flex: 1 } },
            React.createElement(Text, { style: { ...styles.itemSubtitle, marginBottom: 0 } }, `${String(i + 1).padStart(2, '0')}`),
            React.createElement(Text, { style: { ...styles.itemTitle, marginBottom: 0 } }, title),
          ),
          impact
            ? React.createElement(Text, { style: { ...styles.impactBadge, marginTop: 0, marginLeft: 8 } }, impact)
            : null,
        )
      }),
      React.createElement(View, { style: { marginTop: 10, paddingTop: 6, borderTopWidth: 1, borderTopColor: RULE_COLOR } },
        React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, marginBottom: 2 } }, 'Methodology'),
        React.createElement(Text, { style: { fontSize: 7, color: MUTED, lineHeight: 1.4 } },
          `Recommendations are derived from ${companyName}'s measured usage, carbon, water, and licence data collected via provider admin APIs during ${reportingPeriod}. Impact estimates are based on GreenLens AI's cross-organisational analysis of comparable deployments. Priority weighting considers financial magnitude, compliance deadline urgency, and implementation feasibility. Chart bars represent relative estimated impact across the three dimensions: cost reduction, environmental improvement, and strategic positioning.`
        ),
      ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 12 — ESG DISCLOSURE STATEMENT
  // ════════════════════════════════════════════════════════════════════════════

  const EsgSummaryChart = () => {
    const entries = [
      { label: 'Carbon Footprint', unit: 'kg CO₂e', val: carbonKg, color: GREEN },
      { label: 'Optimised Carbon', unit: 'kg CO₂e', val: altCarbon, color: GREEN_LIGHT },
      { label: 'Carbon Savings', unit: 'kg CO₂e', val: carbonSavings, color: '#52b788' },
      { label: 'Water Consumed', unit: 'k litres', val: waterLiters != null ? waterLiters / 1000 : null, color: '#2980b9' },
    ].filter(v => v.val != null) as { label: string; unit: string; val: number; color: string }[]

    if (entries.length === 0) return null

    const maxVal = Math.max(...entries.map(v => v.val), 1)
    const BAR_W = 280
    const svgHeight = entries.length * 28 + 16

    return React.createElement(View, { style: { marginBottom: 10 } },
      React.createElement(Svg as unknown as React.ComponentType<{ width: number; height: number; viewBox: string }>,
        { width: 460, height: svgHeight, viewBox: `0 0 460 ${svgHeight}` },
        React.createElement(Rect as unknown as React.ComponentType<{ x: number; y: number; width: number; height: number; fill: string }>,
          { x: 0, y: 0, width: 460, height: svgHeight, fill: BG_CARD }
        ),
        ...entries.flatMap(({ label, unit, val, color }, i) => {
          const bw = Math.max(4, (val / maxVal) * BAR_W)
          const y = 14 + i * 28
          return [
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
              { key: `esg-lbl-${i}`, x: 8, y: y, fontSize: 7, fill: MUTED }, label
            ),
            React.createElement(Rect as unknown as React.ComponentType<{ key?: string; x: number; y: number; width: number; height: number; fill: string; rx: number }>,
              { key: `esg-bar-${i}`, x: 8, y: y + 4, width: bw, height: 12, fill: color, rx: 2 }
            ),
            React.createElement(Text as unknown as React.ComponentType<{ key?: string; x: number; y: number; fontSize: number; fill: string }>,
              { key: `esg-val-${i}`, x: bw + 14, y: y + 14, fontSize: 8, fill: DARK },
              `${fmt(val, val > 1000 ? 0 : 2)} ${unit}`
            ),
          ]
        }),
      )
    )
  }

  const defaultEsgText = `${companyName} is committed to the transparent and accurate disclosure of its artificial intelligence environmental impacts in accordance with internationally recognised sustainability reporting frameworks. The data presented in this report has been collected by GreenLens AI using automated integration with provider administrative APIs and represents a complete account of organisational AI consumption across all connected accounts during the reporting period ${reportingPeriod}.

Carbon dioxide equivalent (CO₂e) emissions attributable to AI operations have been calculated using published energy intensity coefficients for each model class, combined with regional grid carbon intensity factors aligned to IPCC AR6 recommendations. Water consumption estimates are derived from the water usage effectiveness (WUE) metrics published by the relevant data centre operators, adjusted for the regional mix of infrastructure used by each AI provider.

All figures in this report represent Scope 3 indirect emissions associated with purchased AI services, classified under GHG Protocol Category 1 (Purchased goods and services). No Scope 1 or Scope 2 emissions are attributed. The methodology is aligned to GRI Standard 305-3 (Other indirect (Scope 3) GHG emissions), IFRS S2 Climate-related Disclosures, and the CDP Climate Change Questionnaire.

This disclosure has been prepared in accordance with the EU Corporate Sustainability Reporting Directive (CSRD) double materiality assessment requirements. Both the environmental impact of AI operations (impact materiality) and the financial risks and opportunities associated with AI-related climate factors (financial materiality) have been assessed and determined to be material for the purposes of this report.

Limitations: Estimates are subject to the completeness of provider API data and the accuracy of published energy intensity coefficients, which may be updated as more granular infrastructure data becomes available. GreenLens AI operates a continuous improvement programme for its measurement methodology and will update coefficients as new peer-reviewed data is published.

Data Privacy: No individual employee usage data, prompt content, conversation history, or personally identifiable information is captured, stored, or reported by GreenLens AI at any point in the measurement process. All metrics represent aggregate organisational consumption derived from provider-level usage records.`

  const EsgDisclosurePage = () =>
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(SectionHead, {
        num: '09',
        title: 'ESG Disclosure Statement',
        lead: 'Formal disclosure aligned to CSRD, GRI 305, IFRS S2, and CDP frameworks.',
      }),
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4 } }, 'Framework Alignment'),
      React.createElement(View, { style: styles.frameworkRow },
        ...(frameworks as string[]).map((fw: string) =>
          React.createElement(View, { key: `fw-${fw}`, style: styles.frameworkBadge },
            React.createElement(Text, { style: styles.frameworkText }, fw),
          )
        ),
      ),
      React.createElement(Text, { style: { ...styles.bodyMuted, marginBottom: 4, marginTop: 10 } }, 'Reported Environmental Metrics'),
      React.createElement(EsgSummaryChart, null),
      React.createElement(BodyText, null,
        `${companyName} discloses the environmental impacts of its AI operations in accordance with CSRD, GRI Standard 305-3, IFRS S2, and CDP Climate Change frameworks. Carbon dioxide equivalent (CO₂e) emissions are calculated using published energy intensity coefficients per model class, combined with regional grid carbon intensity factors (aligned to IPCC AR6). Water consumption is derived from WUE metrics published by relevant data centre operators. All figures represent Scope 3 indirect emissions under GHG Protocol Category 1 (Purchased goods and services).`
      ),
      React.createElement(BodyText, null,
        `This disclosure covers ${reportingPeriod} and addresses both impact materiality (AI operations' effect on climate) and financial materiality (climate-related risks to ${companyName}'s financial position), as required by CSRD double-materiality assessment. No individual employee data, prompt content, or personally identifiable information is captured or reported at any point.`
      ),
      React.createElement(BodyText, null,
        `Limitations: estimates are subject to the completeness of provider API data and accuracy of published energy intensity coefficients, which are updated as new peer-reviewed data becomes available.`
      ),
      esgCarbonMethod
        ? React.createElement(View, { style: { marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: RULE_COLOR } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, marginBottom: 2 } },
              'Carbon Calculation Methodology'
            ),
            React.createElement(Text, { style: { fontSize: 7, color: MUTED, lineHeight: 1.5 } }, esgCarbonMethod),
          )
        : null,
      esgWaterMethod
        ? React.createElement(View, { style: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: RULE_COLOR } },
            React.createElement(Text, { style: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: MUTED, marginBottom: 2 } },
              'Water Calculation Methodology'
            ),
            React.createElement(Text, { style: { fontSize: 7, color: MUTED, lineHeight: 1.5 } }, esgWaterMethod),
          )
        : null,
      React.createElement(View, { style: { marginTop: 12, backgroundColor: BG_CARD, borderRadius: 5, padding: 14 } },
        React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 } },
          'Prepared By'
        ),
        React.createElement(Text, { style: styles.bodyMuted },
          `This report was prepared by GreenLens AI on behalf of ${companyName}. This report does not constitute independent third-party assurance; organisations seeking assured ESG disclosures should engage an accredited assurance provider.`
        ),
        React.createElement(Text, { style: { fontSize: 8, color: MUTED, marginTop: 8 } },
          `Report generated: ${today}  ·  Reporting period: ${reportingPeriod}  ·  Generated by GreenLens AI  ·  greenlens.ai`
        ),
      ),
      React.createElement(Footer, null),
    )

  // ════════════════════════════════════════════════════════════════════════════
  // ASSEMBLE DOCUMENT
  // ════════════════════════════════════════════════════════════════════════════

  return React.createElement(Document,
    { title: `${companyName} AI ESG Report`, author: 'GreenLens AI' },
    React.createElement(CoverPage, null),
    React.createElement(TocPage, null),
    React.createElement(ExecSummaryPage1, null),
    React.createElement(ExecSummaryPage2, null),
    React.createElement(UsageProfilePage, null),
    React.createElement(ModelEfficiencyPage, null),
    React.createElement(FootprintPage, null),
    React.createElement(LicensingPage, null),
    React.createElement(IncentivesPage, null),
    React.createElement(HypeCyclePage, null),
    React.createElement(StrategicDecisionsPage, null),
    React.createElement(EsgDisclosurePage, null),
  )
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const requestedReportId = searchParams.get('reportId') ?? null

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('supabase_user_id', user.id)
      .single()
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

    const report = await getPreferredReport(supabase, company.id, requestedReportId)
    if (!report) {
      return NextResponse.json(
        { error: 'No report found. Run an analysis first.' },
        { status: 404 }
      )
    }

    const companyName: string = company.name ?? 'Your Organisation'
    const carbonKg: number | null    = (report.carbon_kg as number | null) ?? null
    const waterLiters: number | null = (report.water_liters as number | null) ?? null
    const effScore: number | null    = (report.model_efficiency_score as number | null) ?? null
    const utilRate: number | null    = (report.license_utilization_rate as number | null) ?? null
    const period: string             = String(report.reporting_period ?? 'current period')

    // ── Try Gemini for richer narratives ────────────────────────────────────
    let geminiNarrative = ''
    let geminiGlobal    = ''

    const execSummaryPrompt = `You are a professional ESG consultant writing a concise chart explanation for an executive summary. Write exactly 2 short paragraphs (2-3 sentences each, no headers, no bullets, no markdown).

Company: ${companyName}
Reporting Period: ${period}
AI Carbon Usage: ${carbonKg != null ? `${carbonKg.toLocaleString()} kg CO2e` : 'measured quantity'}
AI Water Usage: ${waterLiters != null ? `${waterLiters.toLocaleString()} litres` : 'measured quantity'}
Model Efficiency Score: ${effScore != null ? `${effScore}/100` : 'measured score'}
Licence Utilisation Rate: ${utilRate != null ? `${utilRate.toFixed(1)}%` : 'measured rate'}

Paragraph 1: Briefly explain what the carbon and water usage comparison chart shows — current vs prior period trend and what it means for the organisation. Keep it to 2-3 sentences.
Paragraph 2: One actionable suggestion based on the data — focus on model selection optimisation and licence rationalisation. Keep it to 2 sentences.

Write in authoritative corporate language for a board-level audience. Be concise — executives don't read long blocks of text.`

    const globalNarrativePrompt = `Write 1-2 concise sentences (no headers, no bullets, no markdown) introducing a regulatory compliance and incentives table in a professional ESG report.

Company: ${companyName}

The sentence(s) should briefly state that global regulators now mandate AI environmental disclosure and that the table below summarises the key compliance frameworks, penalties, and financial incentives. Mention CSRD and the financial value of documented sustainability data. Be concise — the table does the heavy lifting.`

    try {
      geminiNarrative = await generateWithGemini(execSummaryPrompt)
    } catch (geminiErr) {
      console.warn('[/api/reports/export] Gemini narrative failed, using template:', geminiErr instanceof Error ? geminiErr.message : String(geminiErr))
    }

    try {
      geminiGlobal = await generateWithGemini(globalNarrativePrompt)
    } catch (geminiErr) {
      console.warn('[/api/reports/export] Gemini global narrative failed, using template:', geminiErr instanceof Error ? geminiErr.message : String(geminiErr))
    }

    // ── Render PDF ────────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(EsgPDF, {
        report: report as Record<string, unknown>,
        companyName,
        geminiNarrative,
        geminiGlobal,
      }) as unknown as any
    )

    const companySlug = companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const dateSlug    = new Date().toISOString().slice(0, 10)
    const filename    = `${companySlug}-ai-esg-report-${dateSlug}.pdf`

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[/api/reports/export] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
