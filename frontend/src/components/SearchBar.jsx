const SearchBar = ({ value, onChange }) => {
  return (
    <div className="px-4 pt-6 pb-4">
      <label htmlFor="account-search" className="sr-only">
        Search accounts
      </label>
      <div className="relative">
        <input
          id="account-search"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search accounts"
          className="w-full rounded-lg border border-slate-700 bg-sidebar-active px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-500"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 1 0 3.478 9.75l3.386 3.386a.75.75 0 1 0 1.06-1.06l-3.386-3.386A5.5 5.5 0 0 0 9 3.5Zm-4 5.5a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  )
}

export default SearchBar
