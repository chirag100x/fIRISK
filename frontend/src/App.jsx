import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/60 rounded-2xl p-8 shadow-2xl text-center backdrop-blur-sm">
        <div className="flex justify-center gap-6 mb-6">
          <a href="https://vite.dev" target="_blank" rel="noreferrer">
            <img src={viteLogo} className="h-16 w-16 hover:scale-110 transition-transform duration-200" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank" rel="noreferrer">
            <img src={reactLogo} className="h-16 w-16 hover:scale-110 transition-transform duration-200" alt="React logo" />
          </a>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Vite + React + Tailwind
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          P_049 — Financial Risk Analytics &amp; Forecasting Tool
        </p>
        <button
          type="button"
          onClick={() => setCount((count) => count + 1)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium rounded-lg shadow-md transition-all duration-150 cursor-pointer"
        >
          Count is {count}
        </button>
        <p className="mt-6 text-xs text-slate-400">
          Edit <code className="bg-slate-700/80 px-1.5 py-0.5 rounded text-blue-300">src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </div>
  )
}

export default App
