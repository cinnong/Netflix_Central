import { useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import TabBar from './components/TabBar'
import MainContent from './components/MainContent'
import Modal from './components/Modal'

const BASE_TABS = [
  { title: 'Account', url: 'https://www.netflix.com/account' },
  { title: 'Password', url: 'https://www.netflix.com/password' },
  { title: 'Login Help', url: 'https://www.netflix.com/id/loginhelp' },
  { title: 'Gmail', url: 'https://mail.google.com/mail/u/0/?view=cm&fs=1&to=' },
  { title: 'TV2', url: 'https://www.netflix.com/tv2' },
]

const INITIAL_ACCOUNTS = [
  { id: 'acc-1', email: 'dina1@gmail.com' },
  { id: 'acc-2', email: 'dina2@gmail.com' },
  { id: 'acc-3', email: 'dina3@gmail.com' },
]

const buildAccountTabs = (email) =>
  BASE_TABS.map((tab, index) => ({
    id: `${tab.title.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    title: tab.title,
    url: tab.title === 'Gmail' ? `${tab.url}${email}` : tab.url,
  }))

function App() {
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS)
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState('')
  const [searchValue, setSearchValue] = useState('')

  const [modalState, setModalState] = useState({
    type: null,
    payload: null,
    version: 0,
  })

  const filteredAccounts = useMemo(() => {
    const trimmed = searchValue.trim().toLowerCase()
    if (!trimmed) {
      return accounts
    }
    return accounts.filter((account) => account.email.toLowerCase().includes(trimmed))
  }, [accounts, searchValue])

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  )

  const resetTabsForAccount = (account) => {
    if (!account) {
      setTabs([])
      setActiveTabId('')
      return
    }
    const generatedTabs = buildAccountTabs(account.email)
    setTabs(generatedTabs)
    setActiveTabId(generatedTabs[0]?.id ?? '')
  }

  const handleSelectAccount = (accountId) => {
    const account = accounts.find((item) => item.id === accountId) || null
    setSelectedAccountId(accountId)
    resetTabsForAccount(account)
  }

  const handleSelectTab = (tabId) => {
    setActiveTabId(tabId)
  }

  const handleCloseTab = (tabId) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex((tab) => tab.id === tabId)
      if (index === -1) {
        return prevTabs
      }
      const updated = prevTabs.filter((tab) => tab.id !== tabId)
      if (tabId === activeTabId) {
        const nextTab = updated[index] || updated[index - 1] || null
        setActiveTabId(nextTab ? nextTab.id : '')
      }
      return updated
    })
  }

  const handleAddTab = () => {
    setModalState({ type: 'add-tab', payload: null, version: Date.now() })
  }

  const handleEditTab = (tabId) => {
    const tab = tabs.find((item) => item.id === tabId)
    if (!tab) {
      return
    }
    setModalState({ type: 'edit-tab', payload: tab, version: Date.now() })
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null

  const handleAddAccount = () => {
    setModalState({ type: 'add-account', payload: null, version: Date.now() })
  }

  const handleEditAccount = (account) => {
    setModalState({ type: 'edit-account', payload: account, version: Date.now() })
  }

  const handleDeleteAccount = (accountId) => {
    setAccounts((prev) => prev.filter((account) => account.id !== accountId))
    if (selectedAccountId === accountId) {
      setSelectedAccountId('')
      resetTabsForAccount(null)
    }
  }

  const closeModal = () => {
    setModalState({ type: null, payload: null, version: Date.now() })
  }

  const submitAccountModal = (values) => {
    if (modalState.type === 'add-account') {
      const newAccount = {
        id: `acc-${Date.now()}`,
        email: values.email.trim(),
      }
      setAccounts((prev) => [...prev, newAccount])
      setSearchValue('')
      closeModal()
      return
    }

    if (modalState.type === 'edit-account' && modalState.payload) {
      const updatedEmail = values.email.trim()
      setAccounts((prev) =>
        prev.map((account) =>
          account.id === modalState.payload.id
            ? { ...account, email: updatedEmail }
            : account,
        ),
      )

      if (selectedAccountId === modalState.payload.id) {
        const regeneratedTabs = buildAccountTabs(updatedEmail)
        setTabs(regeneratedTabs)
        setActiveTabId(regeneratedTabs[0]?.id ?? '')
      }

      closeModal()
    }
  }

  const submitTabModal = (values) => {
    if (modalState.type === 'add-tab') {
      const newTab = {
        id: `custom-tab-${Date.now()}`,
        title: values.title.trim() || 'New Tab',
        url: values.url.trim(),
      }
      setTabs((prev) => [...prev, newTab])
      setActiveTabId(newTab.id)
      closeModal()
      return
    }

    if (modalState.type === 'edit-tab' && modalState.payload) {
      const updatedTab = {
        ...modalState.payload,
        title: values.title.trim() || 'New Tab',
        url: values.url.trim(),
      }
      setTabs((prev) => prev.map((tab) => (tab.id === updatedTab.id ? updatedTab : tab)))
      closeModal()
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar
        accounts={filteredAccounts}
        selectedAccountId={selectedAccountId}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSelectAccount={handleSelectAccount}
        onAddAccount={handleAddAccount}
        onEditAccount={handleEditAccount}
        onDeleteAccount={handleDeleteAccount}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          selectedAccountEmail={selectedAccount?.email ?? ''}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onAddTab={handleAddTab}
          onEditTab={handleEditTab}
        />
        <MainContent activeTab={activeTab} />
      </div>

      <Modal
        key={`account-modal-${modalState.version}`}
        isOpen={modalState.type === 'add-account' || modalState.type === 'edit-account'}
        title={modalState.type === 'edit-account' ? 'Edit Account' : 'Add Account'}
        description={modalState.type === 'edit-account' ? 'Update the email for this Netflix account.' : 'Add a new Netflix account email.'}
        fields={[{ name: 'email', label: 'Email', placeholder: 'name@example.com' }]}
        initialValues={{ email: modalState.payload?.email ?? '' }}
        onClose={closeModal}
        onSubmit={submitAccountModal}
      />

      <Modal
        key={`tab-modal-${modalState.version}`}
        isOpen={modalState.type === 'add-tab' || modalState.type === 'edit-tab'}
        title={modalState.type === 'edit-tab' ? 'Edit Tab' : 'Add Tab'}
        description={modalState.type === 'edit-tab' ? 'Update the title or URL for this tab.' : 'Create a new custom tab.'}
        fields={[
          { name: 'title', label: 'Tab Title', placeholder: 'My Dashboard' },
          { name: 'url', label: 'URL', placeholder: 'https://example.com' },
        ]}
        initialValues={{
          title: modalState.payload?.title ?? '',
          url: modalState.payload?.url ?? '',
        }}
        onClose={closeModal}
        onSubmit={submitTabModal}
      />
    </div>
  )
}

export default App
