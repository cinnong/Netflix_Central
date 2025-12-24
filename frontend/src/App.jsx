import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [filterLabel, setFilterLabel] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const filterRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFilters && filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilters])

  const filteredAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return []
    const trimmed = searchValue.trim().toLowerCase()

    const list = accounts.filter((account) => {
      const matchesSearch = trimmed ? account.netflix_email.toLowerCase().includes(trimmed) : true
      const matchesLabel = filterLabel === 'all' ? true : account.label?.trim().toLowerCase() === filterLabel
      const matchesStatus = filterStatus === 'all' ? true : account.status === filterStatus
      return matchesSearch && matchesLabel && matchesStatus
    })

    return [...list].sort((a, b) => a.netflix_email.localeCompare(b.netflix_email))
  }, [accounts, searchValue, filterLabel, filterStatus])

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

  const summaryStats = useMemo(() => {
    if (!Array.isArray(accounts)) return { total: 0, active: 0, inactive: 0, bulanan: 0, mingguan: 0 }

    let total = accounts.length
    let active = 0
    let inactive = 0
    let bulanan = 0
    let mingguan = 0

    accounts.forEach((account) => {
      if (account.status === 'active') active += 1
      else if (account.status === 'inactive') inactive += 1

      const label = (account.label || '').trim().toLowerCase()
      if (label === 'bulanan') bulanan += 1
      if (label === 'mingguan') mingguan += 1
    })

    return { total, active, inactive, bulanan, mingguan }
  }, [accounts])

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
  const payload = {
    label: values.label?.trim(),
    netflix_email: values.netflix_email?.trim(),
    status: values.status || 'active',
  }

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
		const message = error?.message || 'Auth gagal, coba lagi.'
		Swal.fire({ title: 'Gagal', text: message, icon: 'error' })
    }
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Apakah kamu yakin ingin logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, logout',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#e11d48',
    }).then((result) => {
      if (!result.isConfirmed) return
      setTokenState('')
      setAuthToken('')
      setAccounts([])
    })
  }

  const validateAccountForm = (values) => {
    const errors = {}
    const label = values.label?.trim().toLowerCase()
    const email = values.netflix_email?.trim().toLowerCase()
    const status = values.status?.trim().toLowerCase()
    const isDuplicate = email
      ? accounts.some(
          (account) =>
            account.netflix_email?.toLowerCase() === email &&
            (modalState.type === 'add-account' || account.id !== modalState.payload?.id),
        )
      : false

    const allowedLabels = ['bulanan', 'mingguan']
    if (!label || !allowedLabels.includes(label)) {
      errors.label = 'Label wajib (pilih Bulanan atau Mingguan).'
    }

    if (!email) {
      errors.netflix_email = 'Email wajib diisi.'
    } else if (isDuplicate) {
      errors.netflix_email = 'Email sudah ada, tidak boleh duplikat.'
    }

	const allowedStatus = ['active', 'inactive']
	if (!status || !allowedStatus.includes(status)) {
		errors.status = 'Status wajib diisi (aktif / nonaktif).'
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
            <div className="flex w/full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Netflix Accounts</h1>
                {/* <p className="text-sm text-slate-500 dark:text-slate-400">Klik akun untuk membuka Chrome dengan sesi tersimpan.</p> */}
              </div>
              <div className="fixed right-4 top-6 z-30 flex flex-col items-end gap-2 sm:right-6 sm:top-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSummary((prev) => !prev)}
                    aria-label="Lihat rangkuman"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-base transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                  >
                    🧾
                  </button>
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label="Toggle theme"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    aria-label="Logout"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-rose-200 bg-white text-base text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/40 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-rose-500/10"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 7V5a2 2 0 0 1 2-2h7" />
                      <path d="M10 17v2a2 2 0 0 0 2 2h7" />
                      <path d="M10 12h10" />
                      <path d="m15 8 5 4-5 4" />
                      <path d="M3 5v14" />
                      <path d="M10 5H5" />
                      <path d="M10 19H5" />
                    </svg>
                  </button>
                </div>
                <div ref={filterRef} className="relative mt-3 self-start">
                  <button
                    type="button"
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-label="Filter"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-base text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 5h16" />
                      <path d="M8 9h8" />
                      <path d="M10 13h4" />
                      <path d="M11 13v6l2 1v-7" />
                    </svg>
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 top-12 z-30 w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                      <div className="mb-2 flex items-center justify-end text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => {
                            setFilterLabel('all')
                            setFilterStatus('all')
                            setShowFilters(false)
                          }}
                          className="text-[11px] font-medium text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          Reset
                        </button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <label className="space-y-1 block">
                          <span className="text-xs text-slate-500 dark:text-slate-300">Label</span>
                          <select
                            value={filterLabel}
                            onChange={(e) => setFilterLabel(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <option value="all">Semua label</option>
                            <option value="bulanan">Bulanan</option>
                            <option value="mingguan">Mingguan</option>
                          </select>
                        </label>
                        <label className="space-y-1 block">
                          <span className="text-xs text-slate-500 dark:text-slate-300">Status</span>
                          <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <option value="all">Semua status</option>
                            <option value="active">Aktif</option>
                            <option value="inactive">Nonaktif</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="relative flex w/full max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full sm:flex-1">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder="Cari berdasarkan email"
                    className="w-full sm:min-w-[420px] sm:max-w-2xl rounded-lg border border-slate-200 px-4 py-2.5 pr-10 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue('')}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-2 my-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                  >
                    ×
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
                <button
                  type="button"
                  onClick={handleAddAccount}
                  aria-label="Add account"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-lg font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  +
                </button>
              </div>
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
                          <div className="flex items-center gap-2">
                            <div className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">{account.netflix_email}</div>
                            <span
                              className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                account.status === 'inactive'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-200'
                                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100'
                              }`}
                            >
                              {account.status === 'inactive' ? 'Nonaktif' : 'Aktif'}
                            </span>
                          </div>
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
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              <svg
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="m4 20 4.5-1.2L19 8.3a1 1 0 0 0-.1-1.4l-1.8-1.8a1 1 0 0 0-1.4-.1L5.2 15.5 4 20Z" />
                                <path d="m14.5 6.5 3 3" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteAccount(account.id)
                              }}
                              aria-label="Delete account"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-rose-200 text-rose-600 transition hover:bg-rose-50 dark:border-rose-400/40 dark:text-rose-300 dark:hover:bg-rose-500/10"
                            >
                              <svg
                                aria-hidden="true"
                                className="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.7"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M4 7h16" />
                                <path d="M9 3h6" />
                                <path d="M10 11v6" />
                                <path d="M14 11v6" />
                                <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
                              </svg>
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

      {showSummary && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 px-4 py-10 backdrop-blur-sm sm:items-center"
          onClick={() => setShowSummary(false)}
        >
          <div
            className="relative w/full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Rangkuman</p>
                <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Status akun & label</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSummary(false)}
                aria-label="Tutup rangkuman"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm sm:gap-4">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/40">
                <p className="text-xs text-slate-500 dark:text-slate-300">Total akun</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summaryStats.total}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/40">
                <p className="text-xs text-slate-500 dark:text-slate-300">Aktif / Nonaktif</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summaryStats.active} / {summaryStats.inactive}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/40">
                <p className="text-xs text-slate-500 dark:text-slate-300">Total akun Bulanan</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summaryStats.bulanan}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/40">
                <p className="text-xs text-slate-500 dark:text-slate-300">Total akun Mingguan</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{summaryStats.mingguan}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal
        key={`account-modal-${modalState.version}`}
        isOpen={modalState.type === 'add-account' || modalState.type === 'edit-account'}
        title={modalState.type === 'edit-account' ? 'Edit Account' : 'Add Account'}
        description={modalState.type === 'edit-account' ? 'Update the label or Netflix email for this account.' : 'Add a new Netflix account with a friendly label.'}
        fields={[
          {
            name: 'label',
            label: 'Label',
            type: 'select',
            options: [
              { value: 'bulanan', label: 'Bulanan' },
              { value: 'mingguan', label: 'Mingguan' },
            ],
            placeholder: 'Pilih label',
          },
          { name: 'netflix_email', label: 'Netflix Email', placeholder: 'name@example.com' },
            { name: 'status', label: 'Status', type: 'select', options: [
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Nonaktif' },
            ], placeholder: 'Pilih status' },
        ]}
        initialValues={{
          label: modalState.payload?.label ?? '',
          netflix_email: modalState.payload?.netflix_email ?? '',
			status: modalState.payload?.status ?? 'active',
        }}
        onClose={closeModal}
        onSubmit={submitAccountModal}
        onValidate={validateAccountForm}
      />
    </div>
  )
}

export default App
