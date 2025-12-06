import TabItem from './TabItem'

const TabBar = ({
  tabs,
  activeTabId,
  selectedAccountEmail,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onEditTab,
}) => {
  return (
    <header className="flex flex-col bg-white shadow-md">
      <div className="flex items-center justify-between px-6 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Active Account</p>
          <p className="text-sm font-semibold text-slate-700">
            {selectedAccountEmail || 'No account selected'}
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTab}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Add new tab"
        >
          +
        </button>
      </div>
      <div className="mt-4 flex h-14 items-end overflow-x-auto px-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300">
        <div className="flex items-end space-x-2 pb-1">
          {tabs.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onSelect={onSelectTab}
              onEdit={onEditTab}
              onClose={onCloseTab}
            />
          ))}
        </div>
      </div>
    </header>
  )
}

export default TabBar
