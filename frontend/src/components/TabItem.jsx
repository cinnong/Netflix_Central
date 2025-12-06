const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-3.5 w-3.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.75 3.75l1.5-1.5a1.25 1.25 0 0 1 1.77 1.77l-1.5 1.5m-1.77-1.77L7.5 12.25l-.5 2 2-.5 7.25-7.25"
    />
  </svg>
)

const TabItem = ({ tab, isActive, onSelect, onEdit, onClose }) => {
  return (
    <div
      className={`group flex items-center rounded-t-lg border border-b-0 px-3 py-2 text-sm transition-colors ${
        isActive
          ? 'border-slate-200 bg-white text-slate-900 shadow-tab'
          : 'border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(tab.id)}
        className="flex-1 truncate text-left font-medium"
      >
        {tab.title || 'Untitled'}
      </button>
      <div className="ml-2 flex items-center space-x-1 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit(tab.id)
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          aria-label={`Edit ${tab.title}`}
        >
          <PencilIcon />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onClose(tab.id)
          }}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-base leading-none text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
          aria-label={`Close ${tab.title}`}
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default TabItem
