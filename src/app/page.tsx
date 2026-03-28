'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Droplets,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Link2,
  Database,
  Calculator,
  FileText,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import ExecutiveReport from '@/components/landing/ExecutiveReport';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="flex items-center justify-between h-16 px-6 lg:px-10">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#4C7060] flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-lg tracking-tight text-white">GreenLens AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm text-white/75 hover:text-white transition-colors">Problem</a>
            <a href="#solution" className="text-sm text-white/75 hover:text-white transition-colors">Solution</a>
            <a href="#product" className="text-sm text-white/75 hover:text-white transition-colors">Product</a>
            <a href="#how-it-works" className="text-sm text-white/75 hover:text-white transition-colors">How it works</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-sm text-white/75 hover:text-white transition-colors px-3 py-2">
              Log in
            </Link>
            <Link href="/login" className="btn-primary text-sm px-4 py-2 rounded-md font-medium">
              Get a sample report
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/60 border-t border-white/10">
            <div className="container-custom py-4 flex flex-col gap-3">
              <Link href="/login" className="text-sm text-white/75 hover:text-white py-1">
                Log in
              </Link>
              <Link href="/login" className="btn-primary text-sm px-4 py-2 rounded-md font-medium text-center">
                Get a sample report
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative hero-nature-bg overflow-hidden min-h-screen flex flex-col justify-center">
        <div className="flex items-center gap-8 w-full">
          {/* Left: Text */}
          <div className="pl-20 lg:pl-28 shrink-0 w-[48%]">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.1] mb-10 fade-in-up text-white">
              Measure the environmental cost of your enterprise AI
            </h1>

            <div className="flex flex-col sm:flex-row items-start gap-4 fade-in-up animation-delay-100">
              <Link
                href="/login"
                className="btn-primary text-base px-6 py-3 rounded-md font-medium w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Get a sample report
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary-dark text-base px-6 py-3 rounded-md font-medium w-full sm:w-auto text-center"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Right: Dashboard mockup — flush to right edge */}
          <div className="flex-1 fade-in-up animation-delay-200 flex justify-center items-center px-8">
            <div className="dashboard-shadow rounded-tl-lg rounded-tr-lg overflow-hidden border-t border-l border-r border-white/10 w-full">
              <ExecutiveReport />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 lg:py-32 bg-[#fafafa]">
        <div className="container-custom">
          <div className="max-w-3xl mb-16">
            <p className="text-[#4C7060] text-sm font-medium tracking-wide uppercase mb-4">
              The Problem
            </p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 text-[#1a1a1a]">
              Enterprises are scaling AI without visibility into environmental impact
            </h2>
            <p className="text-[#555] text-lg">
              Leadership teams are making AI investment decisions in the dark. No carbon data. No water metrics. No license utilization insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: <BarChart3 className="w-5 h-5" strokeWidth={1.5} />,
                title: 'Rapid AI adoption with zero measurement',
                description: 'Companies deploy AI across departments without tracking environmental footprint or resource consumption.'
              },
              {
                icon: <Droplets className="w-5 h-5" strokeWidth={1.5} />,
                title: 'No visibility into AI carbon and water usage',
                description: 'Leadership has no dashboards showing the real environmental cost of their AI infrastructure.'
              },
              {
                icon: <Zap className="w-5 h-5" strokeWidth={1.5} />,
                title: 'Overpaying for underutilized AI licenses',
                description: 'Flat enterprise licenses create hidden waste. Teams pay for capacity they don\'t use.'
              },
              {
                icon: <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />,
                title: 'ESG and board reporting gaps',
                description: 'Sustainability teams lack the data they need for AI governance and regulatory compliance.'
              }
            ].map((item, index) => (
              <div
                key={index}
                className={`bg-white border border-[#e5e5e5] p-6 rounded-lg card-hover fade-in-up stagger-${index + 1}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center mb-4 text-[#4C7060]">
                  {item.icon}
                </div>
                <h3 className="text-lg font-medium mb-2 text-[#1a1a1a]">{item.title}</h3>
                <p className="text-[#666] text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Solution Section */}
      <section id="solution" className="py-24 lg:py-32 bg-white flow-lines">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#4C7060] text-sm font-medium tracking-wide uppercase mb-4">
                The Solution
              </p>
              <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 text-[#1a1a1a]">
                One platform for AI sustainability intelligence
              </h2>
              <p className="text-[#555] text-lg mb-8">
                GreenLens AI connects to your existing AI systems, aggregates usage data, and delivers executive-ready insights every month.
              </p>

              <div className="space-y-4">
                {[
                  'Connects to OpenAI, Azure, Microsoft 365, and more',
                  'Pulls real usage data from AI providers',
                  'Calculates carbon and water footprint automatically',
                  'Analyzes license utilization and renewal timing',
                  'Generates executive-ready recommendations'
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#4C7060] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-[#333]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Carbon Tracked', value: '2.4M', unit: 'kg CO₂e' },
                { label: 'Water Measured', value: '890K', unit: 'liters' },
                { label: 'License Savings', value: '$1.2M', unit: 'identified' },
                { label: 'Reports Generated', value: '12K+', unit: 'monthly' }
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white border border-[#e5e5e5] p-6 rounded-lg card-hover metric-glow"
                >
                  <p className="text-[#666] text-xs uppercase tracking-wide mb-2">{stat.label}</p>
                  <p className="text-3xl font-medium number-highlight">{stat.value}</p>
                  <p className="text-[#666] text-sm">{stat.unit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Product Walkthrough Section */}
      <section id="product" className="py-24 lg:py-32 bg-[#fafafa]">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[#4C7060] text-sm font-medium tracking-wide uppercase mb-4">
              Monthly AI Impact Briefing
            </p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 text-[#1a1a1a]">
              Everything leadership needs in one report
            </h2>
            <p className="text-[#555] text-lg">
              Each month, executives receive a comprehensive briefing covering environmental impact, license efficiency, and specific recommendations.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Carbon Footprint - Large */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-lg md:col-span-2 card-hover">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wide mb-1">Carbon Footprint</p>
                  <p className="text-sm text-[#888]">Total AI-related emissions this period</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-[#4C7060]">
                  <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <div className="flex items-end gap-4 mb-4">
                <span className="text-5xl font-medium number-highlight">847</span>
                <span className="text-[#666] text-lg mb-1">kg CO₂e</span>
                <span className="text-[#4C7060] text-sm mb-1.5 flex items-center gap-1">
                  ↓ 12% vs last month
                </span>
              </div>
              <div className="h-24 flex items-end gap-1">
                {[40, 55, 35, 70, 60, 45, 80, 65, 50, 75, 55, 60].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#4C7060] rounded-t-sm opacity-70 hover:opacity-100 transition-opacity"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Water Usage */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-lg card-hover">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#666] text-xs uppercase tracking-wide">Water Usage</p>
                <div className="w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-[#4C7060]">
                  <Droplets className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mb-2">
                <span className="text-4xl font-medium number-highlight">12.4K</span>
                <span className="text-[#666] text-sm ml-2">liters</span>
              </div>
              <p className="text-[#666] text-sm">Data center cooling consumption from AI workloads</p>
            </div>

            {/* License Utilization */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-lg card-hover">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#666] text-xs uppercase tracking-wide">License Utilization</p>
                <div className="w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-[#4C7060]">
                  <Zap className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <div className="mb-4">
                <span className="text-4xl font-medium number-highlight">67%</span>
              </div>
              <div className="w-full h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
                <div className="h-full bg-[#4C7060] rounded-full" style={{ width: '67%' }} />
              </div>
              <p className="text-[#666] text-sm mt-3">33% capacity unused across enterprise licenses</p>
            </div>

            {/* Renewal Risk */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-lg card-hover">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#666] text-xs uppercase tracking-wide">Renewal Risk</p>
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#333]">Azure OpenAI</span>
                  <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded">47 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#333]">Microsoft 365 Copilot</span>
                  <span className="text-xs px-2 py-0.5 bg-[#f0f5f3] text-[#4C7060] rounded">124 days</span>
                </div>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="bg-white border border-[#e5e5e5] p-6 rounded-lg md:col-span-3 lg:col-span-1 card-hover">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[#666] text-xs uppercase tracking-wide">Recommended Actions</p>
                <div className="w-10 h-10 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-[#4C7060]">
                  <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-3">
                {[
                  'Consolidate Azure regions to reduce carbon by 18%',
                  'Right-size Copilot licenses for Finance team',
                  'Migrate batch jobs to off-peak hours'
                ].map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#fafafa] rounded-lg">
                    <ChevronRight className="w-4 h-4 text-[#4C7060] mt-0.5 flex-shrink-0" strokeWidth={1.5} />
                    <span className="text-sm text-[#333]">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 lg:py-32 bg-white grid-texture">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[#4C7060] text-sm font-medium tracking-wide uppercase mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 text-[#1a1a1a]">
              From connection to insight in four steps
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: <Link2 className="w-6 h-6" strokeWidth={1.5} />,
                title: 'Connect providers',
                description: 'Link your AI infrastructure—OpenAI, Azure, Microsoft 365, and more.'
              },
              {
                step: '02',
                icon: <Database className="w-6 h-6" strokeWidth={1.5} />,
                title: 'Aggregate data',
                description: 'We pull usage metrics automatically from all connected services.'
              },
              {
                step: '03',
                icon: <Calculator className="w-6 h-6" strokeWidth={1.5} />,
                title: 'Run calculations',
                description: 'Carbon, water, and efficiency metrics computed using verified models.'
              },
              {
                step: '04',
                icon: <FileText className="w-6 h-6" strokeWidth={1.5} />,
                title: 'Generate briefing',
                description: 'Monthly executive report delivered with insights and recommendations.'
              }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-white border border-[#e5e5e5] p-6 rounded-lg h-full card-hover">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[#4C7060] text-sm font-medium">{item.step}</span>
                    <div className="w-12 h-12 rounded-lg bg-[#f0f5f3] flex items-center justify-center text-[#4C7060]">
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2 text-[#1a1a1a]">{item.title}</h3>
                  <p className="text-[#666] text-sm leading-relaxed">{item.description}</p>
                </div>
                {/* Connector line */}
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-[1px] bg-[#e5e5e5]" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Differentiation Section */}
      <section className="py-24 lg:py-32 bg-[#fafafa]">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-[#4C7060] text-sm font-medium tracking-wide uppercase mb-4">
              Why GreenLens AI
            </p>
            <h2 className="text-3xl sm:text-4xl font-medium tracking-tight mb-6 text-[#1a1a1a]">
              Built for leadership, not engineers
            </h2>
            <p className="text-[#555] text-lg">
              Unlike dev tools and infrastructure monitors, GreenLens AI is designed for executives who need to make decisions—not debug systems.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: 'Leadership-first design',
                description: 'Every metric, chart, and recommendation is crafted for CIOs, CFOs, and sustainability teams—not technical operators.'
              },
              {
                title: 'ESG and governance focus',
                description: 'Purpose-built for sustainability reporting, board presentations, and regulatory compliance.'
              },
              {
                title: 'Works with your stack',
                description: 'Native integrations with OpenAI, Azure, Microsoft 365, and other enterprise AI tools you already use.'
              },
              {
                title: 'From data to decisions',
                description: 'Turns raw usage metrics into clear recommendations leadership can act on immediately.'
              }
            ].map((item, index) => (
              <div
                key={index}
                className="bg-white border border-[#e5e5e5] p-8 rounded-lg card-hover"
              >
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#4C7060] mt-2 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-medium mb-2 text-[#1a1a1a]">{item.title}</h3>
                    <p className="text-[#666] text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-divider" />

      {/* Final CTA Section */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight mb-6 text-[#1a1a1a]">
              Get your first AI impact report
            </h2>
            <p className="text-[#555] text-lg mb-10 max-w-xl mx-auto">
              See exactly how GreenLens AI transforms AI usage data into executive-ready sustainability intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="btn-primary text-base px-8 py-4 rounded-md font-medium w-full sm:w-auto flex items-center justify-center gap-2"
              >
                Request a sample report
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-[#888] text-sm mt-6">
              No commitment required. See a real executive briefing.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e5e5] py-12 bg-[#fafafa]">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-md bg-[#4C7060] flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <span className="font-medium text-lg tracking-tight text-[#1a1a1a]">GreenLens AI</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Privacy</a>
              <a href="#" className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Terms</a>
              <a href="#" className="text-sm text-[#666] hover:text-[#1a1a1a] transition-colors">Contact</a>
            </div>
            <p className="text-sm text-[#888]">
              © 2025 GreenLens AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
