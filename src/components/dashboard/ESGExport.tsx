'use client'

export default function DownloadPDFButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
    >
      Download PDF
    </button>
  )
}
