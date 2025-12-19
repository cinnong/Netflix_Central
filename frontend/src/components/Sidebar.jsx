import SearchBar from './SearchBar'
import AccountList from './AccountList'

const Sidebar = ({
  accounts,
  selectedAccountId,
  searchValue,
  onSearchChange,
  onSelectAccount,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  loading,
}) => {
  return (
    <aside className="flex h-screen w-[260px] flex-col bg-sidebar text-white shadow-lg">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-lg font-semibold tracking-tight">Netflix Accounts</h1>
        <p className="mt-1 text-xs text-slate-500">
          Choose an account to manage quick links.
        </p>
      </div>
      <SearchBar value={searchValue} onChange={onSearchChange} />
      <div className="flex-1 overflow-y-auto pb-6">
        <AccountList
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={onSelectAccount}
          onEditAccount={onEditAccount}
          onDeleteAccount={onDeleteAccount}
          loading={loading}
        />
      </div>
      <div className="border-t border-slate-900/60 px-4 py-4">
        <button
          type="button"
          onClick={onAddAccount}
          className="flex w-full items-center justify-center rounded-full bg-slate-100/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-100/20 hover:text-white focus:outline-none"
        >
          Add Account
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
