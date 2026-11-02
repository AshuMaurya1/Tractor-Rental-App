import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, LoaderCircle, Search, X } from 'lucide-react'

const SearchableSelect = ({
  id,
  label,
  options = [],
  value = '',
  onChange,
  disabled = false,
  loading = false,
  error = '',
  required = false,
  placeholder = 'Search or select…',
  emptyText = 'No results found',
  optionLabel = (option) => option.name,
  optionValue = (option) => option._id || option.value,
}) => {
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const selected = useMemo(() => {
    return options.find((option) => String(optionValue(option)) === String(value))
  }, [options, optionValue, value])

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((option) =>
      String(optionLabel(option) || '').toLowerCase().includes(normalized)
    )
  }, [options, optionLabel, query])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
        setQuery('')
        setHighlightedIndex(-1)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setQuery('')
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const choose = (option) => {
    onChange(option)
    setQuery('')
    setOpen(false)
    setHighlightedIndex(-1)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange({ _id: '', name: '', value: '' })
    setQuery('')
  }

  const handleKeyDown = (e) => {
    if (disabled) return
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true)
        e.preventDefault()
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        choose(filteredOptions[highlightedIndex])
      } else if (filteredOptions.length === 1) {
        choose(filteredOptions[0])
      }
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
          {required && <span className="ml-1 text-rose-500">*</span>}
        </label>
      )}

      {/* Desktop searchable combobox */}
      <div
        onClick={() => {
          if (!disabled) {
            setOpen((prev) => !prev)
            inputRef.current?.focus()
          }
        }}
        className={`hidden min-h-11 cursor-pointer items-center rounded-xl border bg-slate-50 transition sm:flex ${
          error ? 'border-rose-400' : 'border-slate-300 focus-within:border-emerald-600 focus-within:bg-white'
        } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-slate-400'}`}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-options`}
          aria-invalid={Boolean(error)}
          autoComplete="off"
          disabled={disabled}
          value={open ? query : selected ? optionLabel(selected) : ''}
          placeholder={open && selected ? optionLabel(selected) : disabled ? 'Choose previous option first' : placeholder}
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setHighlightedIndex(0)
          }}
          onKeyDown={handleKeyDown}
          className="h-10 min-w-0 flex-1 bg-transparent px-2.5 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
        />

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {loading ? (
          <LoaderCircle className="mr-3 h-4 w-4 animate-spin text-emerald-600 shrink-0" />
        ) : (
          <ChevronDown
            className={`mr-3 h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* Mobile standard select */}
      <select
        id={id}
        value={value}
        disabled={disabled || loading}
        aria-label={label || placeholder}
        aria-invalid={Boolean(error)}
        onChange={(event) => {
          const option = options.find((item) => String(optionValue(item)) === event.target.value)
          if (option) choose(option)
        }}
        className={`min-h-11 w-full rounded-xl border bg-slate-50 px-3 text-sm font-medium text-slate-800 sm:hidden ${
          error ? 'border-rose-400' : 'border-slate-300'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <option value="">{loading ? 'Loading options…' : disabled ? 'Choose previous option first' : placeholder}</option>
        {options.map((option) => (
          <option key={String(optionValue(option))} value={optionValue(option)}>
            {optionLabel(option)}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}

      {open && !disabled && (
        <div
          id={`${id}-options`}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl"
        >
          {loading ? (
            <p className="flex min-h-11 items-center gap-2 px-3 text-sm text-slate-500">
              <LoaderCircle className="h-4 w-4 animate-spin text-emerald-600" /> Loading options…
            </p>
          ) : filteredOptions.length ? (
            filteredOptions.map((option, idx) => {
              const key = String(optionValue(option))
              const isSelected = String(key) === String(value)
              const isHighlighted = idx === highlightedIndex
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  key={key}
                  onClick={() => choose(option)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-medium transition ${
                    isSelected
                      ? 'bg-emerald-50 text-emerald-800 font-bold'
                      : isHighlighted
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="truncate">{optionLabel(option)}</span>
                  {isSelected && <span className="ml-2 text-xs text-emerald-600 font-bold">✓</span>}
                </button>
              )
            })
          ) : (
            <p className="flex min-h-10 items-center px-3 text-xs text-slate-500">{emptyText}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchableSelect
