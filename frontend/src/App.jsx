import { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import Modal from './components/Modal'
import { createAccount, deleteAccount, fetchAccounts, login, openAccount, register, setAuthToken, updateAccount } from './api'

const applyThemeClass = (mode) => {
  const isDark = mode === 'dark'
  const root = document.documentElement
  const body = document.body
  root.classList.toggle('dark', isDark)
  body?.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

function App() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [authToken, setTokenState] = useState(() => localStorage.getItem('authToken') || '')
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ email: '', password: '' })
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme')
    const initial = stored === 'dark' ? 'dark' : 'light'
    applyThemeClass(initial)
    return initial
  })

  const [modalState, setModalState] = useState({ type: null, payload: null, version: 0 })

  useEffect(() => {
    const load = async () => {
      if (!authToken) return
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
    setAuthToken(authToken)
    load()
  }, [authToken])

  useEffect(() => {
    localStorage.setItem('theme', theme)
    applyThemeClass(theme)
  }, [theme])

  const filteredAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return []
    const trimmed = searchValue.trim().toLowerCase()
    const list = trimmed
      ? accounts.filter((account) => account.netflix_email.toLowerCase().includes(trimmed))
      : accounts

    return [...list].sort((a, b) => a.netflix_email.localeCompare(b.netflix_email))
  }, [accounts, searchValue])

  const groupedAccounts = useMemo(() => {
    const groups = {}
    filteredAccounts.forEach((account) => {
      const first = account.netflix_email?.trim()?.[0] || '#'
      const letter = /^[a-zA-Z]$/.test(first) ? first.toUpperCase() : '#'
      if (!groups[letter]) groups[letter] = []
      groups[letter].push(account)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([letter, list]) => ({ letter, list }))
  }, [filteredAccounts])

  const handleSelectAccount = async (accountId) => {
    setSelectedAccountId(accountId)
    try {
      await openAccount(accountId)
    } catch (error) {
      console.error(error)
      alert('Unable to launch Chrome for this account. Ensure Chrome is installed.')
    }
  }

  const handleAddAccount = () => setModalState({ type: 'add-account', payload: null, version: Date.now() })

  const handleEditAccount = (account) => setModalState({ type: 'edit-account', payload: account, version: Date.now() })

  const handleDeleteAccount = async (accountId) => {
    const result = await Swal.fire({
      title: 'Hapus akun?',
      text: 'Profil Chrome akun ini tetap ada di disk sampai dihapus manual.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    })
    if (!result.isConfirmed) return

    try {
      await deleteAccount(accountId)
      setAccounts((prev) => prev.filter((account) => account.id !== accountId))
      if (selectedAccountId === accountId) {
        setSelectedAccountId(null)
      }
      Swal.fire({ title: 'Terhapus', text: 'Akun berhasil dihapus.', icon: 'success', timer: 1400, showConfirmButton: false })
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
        Swal.fire({ title: 'Berhasil', text: 'Akun ditambahkan.', icon: 'success', timer: 1400, showConfirmButton: false })
      }

      if (modalState.type === 'edit-account' && modalState.payload) {
        const updated = await updateAccount(modalState.payload.id, payload)
        setAccounts((prev) => prev.map((account) => (account.id === updated.id ? updated : account)))
        if (selectedAccountId === updated.id) {
          setSelectedAccountId(updated.id)
        }
        Swal.fire({ title: 'Tersimpan', text: 'Akun diperbarui.', icon: 'success', timer: 1400, showConfirmButton: false })
      }
    } catch (error) {
      console.error(error)
      alert('Account save failed. Please try again.')
    } finally {
      closeModal()
    }
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password
    if (!email || !password) return
    try {
      const fn = authMode === 'login' ? login : register
      const res = await fn({ email, password })
      if (res?.token) {
        setTokenState(res.token)
        setAuthToken(res.token)
      }
    } catch (error) {
      Swal.fire({ title: 'Gagal', text: 'Auth gagal, coba lagi.', icon: 'error' })
    }
  }

  const handleLogout = () => {
    setTokenState('')
    setAuthToken('')
    setAccounts([])
  }

  const validateAccountForm = (values) => {
    const errors = {}
    const email = values.netflix_email?.trim().toLowerCase()
    const isDuplicate = email
      ? accounts.some(
          (account) =>
            account.netflix_email?.toLowerCase() === email &&
            (modalState.type === 'add-account' || account.id !== modalState.payload?.id),
        )
      : false

    if (!email) {
      errors.netflix_email = 'Email wajib diisi.'
    } else if (isDuplicate) {
      errors.netflix_email = 'Email sudah ada, tidak boleh duplikat.'
    }

    return errors
  }

  if (!authToken) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <div className="min-h-screen bg-slate-100 px-4 py-10 transition-colors dark:bg-slate-900">
          <div className="mx-auto flex max-w-md flex-col gap-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Netflix Accounts</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Masuk untuk mengelola akun.</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className={`rounded-md px-3 py-2 ${authMode === 'login' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className={`rounded-md px-3 py-2 ${authMode === 'register' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'}`}
              >
                Register
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleAuthSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                <input
                  value={authForm.email}
                  onChange={(e) => setAuthForm((p) => ({ ...p, email: e.target.value }))}
                  type="email"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
                <input
                  value={authForm.password}
                  onChange={(e) => setAuthForm((p) => ({ ...p, password: e.target.value }))}
                  type="password"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                {authMode === 'login' ? 'Login' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-100 px-3 py-10 transition-colors dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-6">
          <div className="flex w-full flex-col items-center gap-3 text-center">
            <div className="flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 text-center sm:text-center">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Netflix Accounts</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Klik akun untuk membuka Chrome dengan sesi tersimpan.</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {theme === 'dark' ? (
                  <>
                    <span aria-hidden="true">☀️</span>
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true">🌙</span>
                    <span>Dark</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/40 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
              >
                Logout
              </button>
            </div>
            <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder="Cari berdasarkan email"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none"
              />
              <button
                type="button"
                onClick={handleAddAccount}
                className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Add Account
              </button>
            </div>
          </div>

          <div className="w-full max-w-7xl space-y-6">
            {loading && <div className="text-center text-sm text-slate-500 dark:text-slate-400">Loading...</div>}
            {!loading && groupedAccounts.length === 0 && (
              <div className="text-center text-sm text-slate-500 dark:text-slate-400">Belum ada akun.</div>
            )}

            {!loading &&
              groupedAccounts.map(({ letter, list }) => (
                <div key={letter} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                      {letter}
                    </div>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {list.map((account) => (
                      <div
                        key={account.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectAccount(account.id)}
                        className="group cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-slate-400/60 dark:border-slate-700 dark:bg-slate-800 dark:focus:ring-slate-600/60"
                      >
                        <div className="w-full text-left">
                          <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{account.netflix_email}</div>
                          <div className="truncate text-sm text-slate-500 dark:text-slate-400">{account.label}</div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Click to launch Chrome</span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAccount(account)
                              }}
                              aria-label="Edit account"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-base text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAccount(account.id)
                              }}
                              aria-label="Delete account"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-200 text-base text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
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
        onValidate={validateAccountForm}
      />
    </div>
  )
}

export default App
