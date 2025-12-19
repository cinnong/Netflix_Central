const MainContent = ({ account, activeTab, onLaunchAccount }) => {
  if (!account) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-100 px-8 pb-12">
        <div className="max-w-xl rounded-2xl bg-white p-10 text-center shadow-panel">
          <h2 className="text-lg font-semibold text-slate-800">Select an account</h2>
          <p className="mt-3 text-sm text-slate-500">
            Choose a Netflix account on the left. Chrome will open with its saved profile so sessions stay signed in.
          </p>
        </div>
      </main>
    )
  }

  if (!activeTab) {
    return (
      <main className="flex flex-1 items-center justify-center bg-slate-100 px-8 pb-12">
        <div className="max-w-xl rounded-2xl bg-white p-10 text-center shadow-panel">
          <h2 className="text-lg font-semibold text-slate-800">No tab selected</h2>
          <p className="mt-3 text-sm text-slate-500">
            Pick a tab above to view its details and open it in Chrome.
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
            <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Active Tab</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-900">{activeTab.title || 'Untitled'}</h2>
            <p className="mt-1 text-sm text-slate-500">{activeTab.url || 'No URL provided'}</p>
            <div className="mt-3 text-xs text-slate-500">
              <p>Account: {account.label}</p>
              <p>Email: {account.netflix_email}</p>
            </div>
          </div>
          {activeTab.url && (
            <button
              type="button"
              onClick={onLaunchAccount}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Launch tabs in Chrome
            </button>
          )}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-left text-slate-700">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Session Notes</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li>Chrome uses the stored profile directory for this account; sessions stay signed in.</li>
            <li>Log in once in Chrome and reuse this account’s button to reopen the same profile.</li>
            <li>Edit or add tabs to control which pages open for this Netflix profile.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

export default MainContent
