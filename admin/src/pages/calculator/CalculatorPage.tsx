import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '../../components/common/PageHeader'

type AngleMode = 'DEG' | 'RAD'
type ToolMode = 'calculator' | 'length' | 'weight' | 'temperature' | 'currency'

type HistoryItem = {
  expression: string
  result: string
  timestamp: string
}

type ConverterUnit = {
  label: string
  value: string
}

const SCIENTIFIC_KEYS = [
  ['sin', 'cos', 'tan', 'sqrt'],
  ['log', 'ln', 'x^y', 'x²'],
  ['(', ')', 'π', 'e'],
] as const

const MAIN_KEYS = [
  ['C', '⌫', '%', '/'],
  ['7', '8', '9', '*'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['+/-', '0', '.', '='],
] as const

const TOOL_TABS: Array<{ key: ToolMode; label: string }> = [
  { key: 'calculator', label: 'Calculator' },
  { key: 'length', label: 'Length' },
  { key: 'weight', label: 'Weight' },
  { key: 'temperature', label: 'Temperature' },
  { key: 'currency', label: 'Currency' },
]

const LENGTH_UNITS: ConverterUnit[] = [
  { label: 'Meter (m)', value: 'm' },
  { label: 'Kilometer (km)', value: 'km' },
  { label: 'Centimeter (cm)', value: 'cm' },
  { label: 'Millimeter (mm)', value: 'mm' },
  { label: 'Inch (in)', value: 'in' },
  { label: 'Foot (ft)', value: 'ft' },
  { label: 'Yard (yd)', value: 'yd' },
  { label: 'Mile (mi)', value: 'mi' },
]

const LENGTH_FACTORS: Record<string, number> = {
  m: 1,
  km: 1000,
  cm: 0.01,
  mm: 0.001,
  in: 0.0254,
  ft: 0.3048,
  yd: 0.9144,
  mi: 1609.344,
}

const WEIGHT_UNITS: ConverterUnit[] = [
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Gram (g)', value: 'g' },
  { label: 'Milligram (mg)', value: 'mg' },
  { label: 'Pound (lb)', value: 'lb' },
  { label: 'Ounce (oz)', value: 'oz' },
  { label: 'Ton (t)', value: 'ton' },
]

const WEIGHT_FACTORS: Record<string, number> = {
  kg: 1,
  g: 0.001,
  mg: 0.000001,
  lb: 0.45359237,
  oz: 0.028349523125,
  ton: 1000,
}

const TEMPERATURE_UNITS: ConverterUnit[] = [
  { label: 'Celsius (°C)', value: 'c' },
  { label: 'Fahrenheit (°F)', value: 'f' },
  { label: 'Kelvin (K)', value: 'k' },
]

const CURRENCY_UNITS: ConverterUnit[] = [
  { label: 'Indian Rupee (INR)', value: 'inr' },
  { label: 'US Dollar (USD)', value: 'usd' },
  { label: 'Euro (EUR)', value: 'eur' },
  { label: 'British Pound (GBP)', value: 'gbp' },
  { label: 'Japanese Yen (JPY)', value: 'jpy' },
  { label: 'UAE Dirham (AED)', value: 'aed' },
]

const CURRENCY_TO_INR: Record<string, number> = {
  inr: 1,
  usd: 83.2,
  eur: 90.7,
  gbp: 106.2,
  jpy: 0.53,
  aed: 22.65,
}

const formatResult = (value: number) => {
  if (!Number.isFinite(value)) return 'Error'
  const rounded = Number.parseFloat(value.toPrecision(12))
  return Number.isInteger(rounded) ? String(rounded) : String(rounded)
}

const sanitizeExpression = (expression: string, angleMode: AngleMode) => {
  if (!expression.trim()) return ''

  let parsed = expression
    .replace(/π/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E')
    .replace(/\^/g, '**')
    .replace(/\bmod\b/gi, '%')

  if (angleMode === 'DEG') {
    parsed = parsed
      .replace(/sin\(/g, 'Math.sin((Math.PI/180)*')
      .replace(/cos\(/g, 'Math.cos((Math.PI/180)*')
      .replace(/tan\(/g, 'Math.tan((Math.PI/180)*')
  } else {
    parsed = parsed
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
  }

  parsed = parsed
    .replace(/sqrt\(/g, 'Math.sqrt(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/ln\(/g, 'Math.log(')

  return parsed
}

export default function CalculatorPage() {
  const [activeTool, setActiveTool] = useState<ToolMode>('calculator')
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState('0')
  const [memory, setMemory] = useState(0)
  const [angleMode, setAngleMode] = useState<AngleMode>('DEG')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [convertValue, setConvertValue] = useState('1')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('ft')

  const calculate = useCallback(() => {
    const parsed = sanitizeExpression(expression, angleMode)
    if (!parsed) {
      setResult('0')
      return
    }

    try {
      // eslint-disable-next-line no-new-func
      const evaluated = Function(`"use strict"; return (${parsed})`)()
      const finalValue = Number(evaluated)
      const formatted = formatResult(finalValue)
      setResult(formatted)

      if (formatted !== 'Error') {
        setHistory(current => [
          {
            expression,
            result: formatted,
            timestamp: new Date().toLocaleTimeString(),
          },
          ...current,
        ].slice(0, 12))
      }
    } catch {
      setResult('Error')
    }
  }, [expression, angleMode])

  const append = (value: string) => {
    setExpression(current => current + value)
  }

  const handleMainKey = (key: string) => {
    if (key === 'C') {
      setExpression('')
      setResult('0')
      return
    }

    if (key === '⌫') {
      setExpression(current => current.slice(0, -1))
      return
    }

    if (key === '=') {
      calculate()
      return
    }

    if (key === '+/-') {
      setExpression(current => {
        if (!current.trim()) return '-'
        return current.startsWith('-') ? current.slice(1) : `-${current}`
      })
      return
    }

    append(key)
  }

  const handleScientificKey = (key: string) => {
    if (key === 'x^y') {
      append('^')
      return
    }

    if (key === 'x²') {
      append('^2')
      return
    }

    if (key === 'π') {
      append('π')
      return
    }

    if (key === 'e') {
      append('e')
      return
    }

    append(`${key}(`)
  }

  const keyboardHint = useMemo(() => 'Tip: Use keyboard numbers/operators and press Enter to evaluate.', [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeTool !== 'calculator') return

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      const key = event.key

      if (key === 'Enter') {
        event.preventDefault()
        calculate()
        return
      }

      if (key === 'Backspace') {
        event.preventDefault()
        setExpression(current => current.slice(0, -1))
        return
      }

      if (key === 'Escape') {
        event.preventDefault()
        setExpression('')
        setResult('0')
        return
      }

      if (/^[0-9.+\-*/()%^()]$/.test(key)) {
        event.preventDefault()
        setExpression(current => current + key)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTool, calculate])

  const convertTemperature = (value: number, from: string, to: string) => {
    if (from === to) return value

    let celsius = value
    if (from === 'f') celsius = (value - 32) * (5 / 9)
    if (from === 'k') celsius = value - 273.15

    if (to === 'c') return celsius
    if (to === 'f') return (celsius * 9) / 5 + 32
    return celsius + 273.15
  }

  const conversionOutput = useMemo(() => {
    const numericValue = Number(convertValue)
    if (!Number.isFinite(numericValue)) return 'Enter a valid number'

    if (activeTool === 'length') {
      const base = numericValue * LENGTH_FACTORS[fromUnit]
      const converted = base / LENGTH_FACTORS[toUnit]
      return formatResult(converted)
    }

    if (activeTool === 'weight') {
      const base = numericValue * WEIGHT_FACTORS[fromUnit]
      const converted = base / WEIGHT_FACTORS[toUnit]
      return formatResult(converted)
    }

    if (activeTool === 'temperature') {
      return formatResult(convertTemperature(numericValue, fromUnit, toUnit))
    }

    if (activeTool === 'currency') {
      const inr = numericValue * CURRENCY_TO_INR[fromUnit]
      const converted = inr / CURRENCY_TO_INR[toUnit]
      return formatResult(converted)
    }

    return '0'
  }, [activeTool, convertValue, fromUnit, toUnit])

  const currentUnits = useMemo(() => {
    if (activeTool === 'length') return LENGTH_UNITS
    if (activeTool === 'weight') return WEIGHT_UNITS
    if (activeTool === 'temperature') return TEMPERATURE_UNITS
    if (activeTool === 'currency') return CURRENCY_UNITS
    return []
  }, [activeTool])

  useEffect(() => {
    if (activeTool === 'length') {
      setFromUnit('m')
      setToUnit('ft')
      return
    }

    if (activeTool === 'weight') {
      setFromUnit('kg')
      setToUnit('lb')
      return
    }

    if (activeTool === 'temperature') {
      setFromUnit('c')
      setToUnit('f')
      return
    }

    if (activeTool === 'currency') {
      setFromUnit('inr')
      setToUnit('usd')
    }
  }, [activeTool])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advanced Calculator"
        subtitle="Scientific calculator plus conversion tools for admin operations"
      />

      <div className="flex flex-wrap gap-2">
        {TOOL_TABS.map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTool(tab.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${activeTool === tab.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTool === 'calculator' ? (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700">
              {(['DEG', 'RAD'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  className={`px-4 py-2 text-sm font-semibold ${angleMode === mode ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'}`}
                  onClick={() => setAngleMode(mode)}
                >
                  {mode}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button type="button" className="btn-secondary" onClick={() => setMemory(0)}>MC</button>
              <button type="button" className="btn-secondary" onClick={() => setExpression(String(memory))}>MR</button>
              <button type="button" className="btn-secondary" onClick={() => setMemory(current => current + Number(result || 0))}>M+</button>
              <button type="button" className="btn-secondary" onClick={() => setMemory(current => current - Number(result || 0))}>M-</button>
              <span className="rounded-lg bg-gray-100 px-3 py-1 font-semibold text-gray-700 dark:bg-slate-800 dark:text-slate-200">M: {formatResult(memory)}</span>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-slate-900">
            <p className="min-h-[28px] break-all text-right text-sm text-gray-500 dark:text-slate-400">{expression || '0'}</p>
            <p className="mt-2 break-all text-right text-3xl font-semibold text-gray-900 dark:text-white">{result}</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              {SCIENTIFIC_KEYS.map((row, rowIndex) => (
                <div key={`sci-${rowIndex}`} className="grid grid-cols-4 gap-2">
                  {row.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleScientificKey(key)}
                      className="rounded-lg border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {MAIN_KEYS.map((row, rowIndex) => (
                <div key={`main-${rowIndex}`} className="grid grid-cols-4 gap-2">
                  {row.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleMainKey(key)}
                      className={`rounded-lg px-3 py-3 text-sm font-semibold transition ${key === '=' ? 'bg-primary-600 text-white hover:bg-primary-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-slate-200 dark:hover:bg-slate-800'}`}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-slate-400">
            <span>{keyboardHint}</span>
            <button type="button" className="btn-secondary text-xs" onClick={calculate}>Evaluate</button>
          </div>
        </section>

        <aside className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">History</h3>
            <button
              type="button"
              className="text-xs font-medium text-primary-600 hover:text-primary-700"
              onClick={() => setHistory([])}
            >
              Clear
            </button>
          </div>

          <div className="max-h-[560px] space-y-2 overflow-y-auto">
            {history.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 p-3 text-xs text-gray-500 dark:border-gray-700 dark:text-slate-400">
                No calculations yet.
              </p>
            )}

            {history.map((item, index) => (
              <button
                key={`${item.timestamp}-${index}`}
                type="button"
                className="w-full rounded-lg border border-gray-200 p-3 text-left transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-slate-800"
                onClick={() => {
                  setExpression(item.expression)
                  setResult(item.result)
                }}
              >
                <p className="truncate text-xs text-gray-500 dark:text-slate-400">{item.expression}</p>
                <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">= {item.result}</p>
                <p className="mt-1 text-[11px] text-gray-400">{item.timestamp}</p>
              </button>
            ))}
          </div>
        </aside>
      </div>
      ) : (
        <section className="card p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Value</label>
                <input
                  type="number"
                  value={convertValue}
                  onChange={event => setConvertValue(event.target.value)}
                  className="input-field"
                  placeholder="Enter value"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">From</label>
                <select
                  className="input-field"
                  value={fromUnit}
                  onChange={event => setFromUnit(event.target.value)}
                >
                  {currentUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => {
                    const currentFrom = fromUnit
                    setFromUnit(toUnit)
                    setToUnit(currentFrom)
                  }}
                >
                  Swap
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">To</label>
                <select
                  className="input-field"
                  value={toUnit}
                  onChange={event => setToUnit(event.target.value)}
                >
                  {currentUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-slate-900">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">Converted Result</p>
              <p className="mt-3 break-all text-3xl font-semibold text-gray-900 dark:text-white">{conversionOutput}</p>

              <div className="mt-4 rounded-xl bg-white p-3 text-sm text-gray-600 dark:bg-slate-800 dark:text-slate-300">
                {convertValue || '0'} {fromUnit.toUpperCase()} = <span className="font-semibold text-gray-900 dark:text-white">{conversionOutput}</span> {toUnit.toUpperCase()}
              </div>

              {activeTool === 'currency' && (
                <p className="mt-3 text-xs text-gray-500 dark:text-slate-400">Currency rates are static reference values (base INR) and can be adjusted in code.</p>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
