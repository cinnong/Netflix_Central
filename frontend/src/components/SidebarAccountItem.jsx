const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 3.75l.75-.75a1.75 1.75 0 0 1 2.5 2.5l-.75.75m-2.5-2.5L6.5 12.25l-.5 3 3-.5 9.5-9.5m-2.5-2.5 2.5 2.5"
    />
  </svg>
)

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className="h-4 w-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5.5 6.25h9m-7.5 0V4.75a1 1 0 0 1 1-1h4.5a1 1 0 0 1 1 1v1.5m-6 0v8.5a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-8.5"
    />
  </svg>
)

const SidebarAccountItem = ({ account, isSelected, onSelect, onEdit, onDelete }) => {
  return (
    <li>
      <div
        className={`group flex items-center justify-between rounded-lg px-3 py-2 transition ${
          isSelected ? 'bg-sidebar-active text-white shadow-inner' : 'text-slate-300 hover:bg-sidebar-hover'
        }`}
      >
        <button
          type="button"
          onClick={() => onSelect(account.id)}
          className="flex-1 truncate text-left text-sm font-medium focus:outline-none"
        >
          <div className="truncate font-semibold text-slate-100">{account.netflix_email}</div>
          <div className="truncate text-xs text-slate-400">{account.label}</div>
        </button>
        <div className="ml-3 flex items-center space-x-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onEdit(account)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-hover/70 text-slate-300 transition hover:bg-slate-600 hover:text-white focus:outline-none"
            aria-label={`Edit ${account.email}`}
          >
            <PencilIcon />
          </button>
          <button
            type="button"
            onClick={() => onDelete(account.id)}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-hover/70 text-slate-300 transition hover:bg-rose-600 hover:text-white focus:outline-none"
            aria-label={`Delete ${account.email}`}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </li>
  )
}

export default SidebarAccountItem
