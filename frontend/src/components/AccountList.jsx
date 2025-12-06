import SidebarAccountItem from './SidebarAccountItem'

const AccountList = ({ accounts, selectedAccountId, onSelectAccount, onEditAccount, onDeleteAccount }) => {
  if (!accounts.length) {
    return (
      <div className="px-4 text-sm text-slate-500">
        <p>No accounts found.</p>
      </div>
    )
  }

  return (
    <ul className="space-y-1 px-2 pb-4">
      {accounts.map((account) => (
        <SidebarAccountItem
          key={account.id}
          account={account}
          isSelected={account.id === selectedAccountId}
          onSelect={onSelectAccount}
          onEdit={onEditAccount}
          onDelete={onDeleteAccount}
        />
      ))}
    </ul>
  )
}

export default AccountList
