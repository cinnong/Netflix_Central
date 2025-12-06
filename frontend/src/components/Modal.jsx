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
}) => {
  const [formValues, setFormValues] = useState(() => initialValues)

  if (!isOpen) {
    return null
  }

  const handleChange = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(formValues)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <label htmlFor={field.name} className="text-sm font-medium text-slate-700">
                {field.label}
              </label>
              <input
                id={field.name}
                name={field.name}
                type={field.type || 'text'}
                required={field.required !== false}
                placeholder={field.placeholder}
                value={formValues[field.name] ?? ''}
                onChange={(event) => handleChange(field.name, event.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 shadow-inner focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400/50"
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
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
