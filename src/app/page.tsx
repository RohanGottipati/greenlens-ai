import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div>
          <span className="text-white font-bold text-lg">GreenLens</span>
          <span className="text-green-400 font-bold text-lg"> AI</span>
        </div>
        <Link href="/login"
          className="bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors">
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-3xl mx-auto">
        <span className="bg-green-900 text-green-300 text-xs font-medium px-3 py-1 rounded-full mb-6">
          Enterprise AI Sustainability
        </span>
        <h1 className="text-5xl font-bold text-white leading-tight mb-6">
          Measure your organisation&apos;s<br />
          <span className="text-green-400">AI carbon footprint</span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-xl">
          GreenLens connects to your AI provider admin APIs to measure carbon emissions, water usage,
          and license efficiency — then generates the regulatory disclosures and cost-saving decisions
          your team actually needs.
        </p>
        <div className="flex gap-4">
          <Link href="/login"
            className="bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            Get started
          </Link>
          <a href="#how-it-works"
            className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white font-semibold px-6 py-3 rounded-xl transition-colors">
            How it works
          </a>
        </div>
      </main>

      {/* Feature strip */}
      <section id="how-it-works" className="grid grid-cols-3 gap-px bg-gray-800 border-t border-gray-800">
        {[
          {
            title: 'Carbon & Water',
            body: 'Token-level energy calculations using model-specific intensity data and regional grid factors.',
          },
          {
            title: 'License Intelligence',
            body: 'Identify dormant seats and right-size your AI subscriptions before renewal.',
          },
          {
            title: 'Regulatory Compliance',
            body: 'Auto-generate CSRD, GRI 305, IFRS S2, and CDP disclosures from your usage data.',
          },
        ].map(f => (
          <div key={f.title} className="bg-gray-950 p-8">
            <h3 className="text-white font-semibold mb-2">{f.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="px-8 py-4 border-t border-gray-800 text-center">
        <p className="text-gray-600 text-xs">
          Organisational data only — no individual user content is ever accessed.
        </p>
      </footer>
    </div>
  )
}
