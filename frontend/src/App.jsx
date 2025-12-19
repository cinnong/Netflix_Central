import { useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar'
import TabBar from './components/TabBar'
import MainContent from './components/MainContent'
import Modal from './components/Modal'
import {
  createAccount,
  createTab,
  deleteAccount,
  deleteTab,
  fetchAccounts,
  fetchTabs,
  openAccount,
  updateAccount,
  updateTab,
} from './api'

function App() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)

  const [modalState, setModalState] = useState({ type: null, payload: null, version: 0 })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchAccounts()
        setAccounts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return []
    const trimmed = searchValue.trim().toLowerCase()
    if (!trimmed) return accounts
    return accounts.filter((account) => account.netflix_email.toLowerCase().includes(trimmed))
  }, [accounts, searchValue])

  const selectedAccount = useMemo(
    () => (Array.isArray(accounts) ? accounts.find((account) => account.id === selectedAccountId) : null),
    [accounts, selectedAccountId],
  )

  const loadTabs = async (accountId) => {
    if (!accountId) return
    try {
      const fetchedTabs = await fetchTabs(accountId)
      setTabs(fetchedTabs)
      setActiveTabId(fetchedTabs[0]?.id ?? null)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSelectAccount = async (accountId) => {
    setSelectedAccountId(accountId)
    await loadTabs(accountId)
    try {
      await openAccount(accountId)
    } catch (error) {
      console.error(error)
      alert('Unable to launch Chrome for this account. Ensure Chrome is installed.')
    }
  }

  const handleSelectTab = (tabId) => setActiveTabId(tabId)

  const handleCloseTab = async (tabId) => {
    if (!selectedAccountId) return
    try {
      await deleteTab(selectedAccountId, tabId)
      setTabs((prev) => {
        const updated = prev.filter((tab) => tab.id !== tabId)
        if (activeTabId === tabId) {
          const idx = prev.findIndex((tab) => tab.id === tabId)
          const next = updated[idx] || updated[idx - 1] || null
          setActiveTabId(next ? next.id : null)
        }
        return updated
      })
    } catch (error) {
      console.error(error)
    }
  }

  const launchInChrome = async () => {
    if (!selectedAccountId) return
    try {
      await openAccount(selectedAccountId)
    } catch (error) {
      console.error(error)
      alert('Unable to launch Chrome for this account. Ensure Chrome is installed.')
    }
  }

  const handleAddTab = () => setModalState({ type: 'add-tab', payload: null, version: Date.now() })

  const handleEditTab = (tabId) => {
    const tab = tabs.find((item) => item.id === tabId)
    if (!tab) return
    setModalState({ type: 'edit-tab', payload: tab, version: Date.now() })
  }

  const handleAddAccount = () => setModalState({ type: 'add-account', payload: null, version: Date.now() })

  const handleEditAccount = (account) => setModalState({ type: 'edit-account', payload: account, version: Date.now() })

  const handleDeleteAccount = async (accountId) => {
    try {
      await deleteAccount(accountId)
      setAccounts((prev) => prev.filter((account) => account.id !== accountId))
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null)
        setTabs([])
        setActiveTabId(null)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const closeModal = () => setModalState({ type: null, payload: null, version: Date.now() })

  const submitAccountModal = async (values) => {
    const payload = { label: values.label?.trim(), netflix_email: values.netflix_email?.trim() }

    try {
      if (modalState.type === 'add-account') {
        const created = await createAccount(payload)
        setAccounts((prev) => [created, ...prev])
        setSearchValue('')
      }

      if (modalState.type === 'edit-account' && modalState.payload) {
        const updated = await updateAccount(modalState.payload.id, payload)
        setAccounts((prev) => prev.map((account) => (account.id === updated.id ? updated : account)))
        if (selectedAccountId === updated.id) {
          setSelectedAccountId(updated.id)
        }
      }
    } catch (error) {
      console.error(error)
      alert('Account save failed. Please try again.')
    } finally {
      closeModal()
    }
  }

  const submitTabModal = async (values) => {
    if (!selectedAccountId) return
    const payload = { title: values.title?.trim() || 'New Tab', url: values.url?.trim() }

    try {
      if (modalState.type === 'add-tab') {
        const created = await createTab(selectedAccountId, payload)
        setTabs((prev) => [...prev, created])
        setActiveTabId(created.id)
      }

      if (modalState.type === 'edit-tab' && modalState.payload) {
        const updated = await updateTab(selectedAccountId, modalState.payload.id, payload)
        setTabs((prev) => prev.map((tab) => (tab.id === updated.id ? updated : tab)))
      }
    } catch (error) {
      console.error(error)
      alert('Tab save failed. Please try again.')
    } finally {
      closeModal()
    }
  }

  const activeTab = tabs.find((tab) => tab.id === activeTabId) || null

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
        loading={loading}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          selectedAccountLabel={selectedAccount?.label ?? ''}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
          onAddTab={handleAddTab}
          onEditTab={handleEditTab}
        />
        <MainContent account={selectedAccount} activeTab={activeTab} onLaunchAccount={launchInChrome} />
      </div>

      <Modal
        key={`account-modal-${modalState.version}`}
        isOpen={modalState.type === 'add-account' || modalState.type === 'edit-account'}
        title={modalState.type === 'edit-account' ? 'Edit Account' : 'Add Account'}
        description={modalState.type === 'edit-account' ? 'Update the label or Netflix email for this account.' : 'Add a new Netflix account with a friendly label.'}
        fields={[
          { name: 'label', label: 'Label', placeholder: 'Netflix Family 1' },
          { name: 'netflix_email', label: 'Netflix Email', placeholder: 'name@example.com' },
        ]}
        initialValues={{
          label: modalState.payload?.label ?? '',
          netflix_email: modalState.payload?.netflix_email ?? '',
        }}
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
