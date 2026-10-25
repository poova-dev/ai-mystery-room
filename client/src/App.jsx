export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-xl p-8 rounded-2xl bg-slate-900 border border-amber-500/20 shadow-2xl">
        <div className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold tracking-wider uppercase">
          Milestone 1 • Initialized
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-amber-400 mb-3 font-serif">
          AI Mystery Room
        </h1>
        <p className="text-slate-300 text-base leading-relaxed mb-6">
          Investigate crimes, analyze clues, interrogate suspects, and identify the culprit with Google Gemini.
        </p>
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-sm text-slate-400">
          Frontend client successfully running on React + Vite + Tailwind CSS.
        </div>
      </div>
    </div>
  )
}
