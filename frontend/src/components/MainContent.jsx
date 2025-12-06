const MainContent = ({ activeTab }) => {
  if (!activeTab) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-100 px-8 pb-12">
        <div className="max-w-xl rounded-2xl bg-white p-10 text-center shadow-panel">
          <h2 className="text-lg font-semibold text-slate-800">No tab selected</h2>
          <p className="mt-3 text-sm text-slate-500">
            Choose a Netflix account on the left to load quick access tabs.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex flex-1 bg-slate-100 px-8 pb-12">
      <div className="mt-8 w-full max-w-5xl rounded-3xl bg-white p-10 shadow-panel">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Active Tab</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">
              {activeTab.title || 'Untitled'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {activeTab.url || 'No URL provided'}
            </p>
          </div>
          {activeTab.url && (
            <button
              type="button"
              onClick={() => window.open(activeTab.url, '_blank', 'noopener,noreferrer')}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Open in Browser
            </button>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-400">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-10 w-10"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 5.25h16.5M3.75 9.75h16.5M3.75 14.25h10.5M3.75 18.75h7.5"
              />
            </svg>
          </div>
          <p className="mt-6 text-base font-medium text-slate-500">
            Page preview placeholder
          </p>
          <p className="mt-2 text-sm text-slate-400">
            This area can host an embedded tool or contextual content for the selected tab.
          </p>
        </div>
      </div>
    </main>
  )
}

export default MainContent
