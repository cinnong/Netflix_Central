import { useState } from 'react'

const Modal = ({
  isOpen,
  title,
  description,
  fields,
  initialValues = {},
  confirmLabel = 'Save',
  cancelLabel = 'Cancel',
  onClose,
  onSubmit,
  onValidate,
}) => {
  const [formValues, setFormValues] = useState(() => initialValues)
  const [fieldErrors, setFieldErrors] = useState({})

  if (!isOpen) {
    return null
  }

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
    setFieldErrors((prev) => {
      if (!prev[name]) return prev
      const next = { ...prev }
      delete next[name]
      return next
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (onValidate) {
      const errors = onValidate(formValues) || {}
      setFieldErrors(errors)
      if (Object.keys(errors).length > 0) return
    }
    onSubmit(formValues)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <label htmlFor={field.name} className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {field.label}
              </label>
              {field.type === 'select' && Array.isArray(field.options) ? (
                <select
                  id={field.name}
                  name={field.name}
                  required={field.required !== false}
                  value={formValues[field.name] ?? ''}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:focus:border-slate-500 dark:focus:ring-slate-500/50"
                >
                  {field.placeholder ? <option value="">{field.placeholder}</option> : null}
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="relative">
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type || 'text'}
                    required={field.required !== false}
                    placeholder={field.placeholder}
                    value={formValues[field.name] ?? ''}
                    onChange={(event) => handleChange(field.name, event.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:shadow-none dark:focus:border-slate-500 dark:focus:ring-slate-500/50"
                  />
                  {formValues[field.name] && (
                    <button
                      type="button"
                      onClick={() => handleChange(field.name, '')}
                      aria-label={`Clear ${field.label}`}
                      className="absolute inset-y-0 right-2 my-auto inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
                    >
                      ×
                    </button>
                  )}
                </div>
              )}
              {fieldErrors[field.name] && <p className="text-xs font-medium text-rose-600">{fieldErrors[field.name]}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Modal
