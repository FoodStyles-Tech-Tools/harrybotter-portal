export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center glass-panel rounded-[2rem] px-10 py-12 border border-white/60">
        <p className="text-[10px] uppercase tracking-[0.3em] text-blue-500/70 font-semibold mb-3">Lost Page</p>
        <h1 className="text-5xl font-semibold text-slate-900 mb-3">404</h1>
        <p className="text-slate-500 mb-8">Page not found</p>
        <a
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-2xl hover:bg-blue-700 transition-colors shadow-[0_12px_30px_rgba(37,99,235,0.25)]"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}

