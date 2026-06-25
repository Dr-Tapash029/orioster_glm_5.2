'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, TriageBadge, SyncStatusBadge } from '@/components/orioster/ui-primitives'
import { Search, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchPatient {
  id: string
  localId: string
  fullName: string
  gender: string
  age: number | null
  chiefComplaint: string | null
  status: string
  syncStatus: string
  vitals: Array<{ triageLevel: string | null }>
}

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, setActivePatient, setView } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchPatient[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!query.trim()) {
      return
    }
    const t = setTimeout(() => {
      setLoading(true)
      fetch(`/api/patients?search=${encodeURIComponent(query)}&limit=10`)
        .then((r) => r.json())
        .then((d) => setResults(d.patients ?? []))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const displayResults = query.trim() ? results : []

  if (!searchOpen) return null

  function selectPatient(id: string) {
    setActivePatient(id)
    setView('patient-detail')
    setSearchOpen(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-16">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md anim-fade-in" onClick={() => setSearchOpen(false)} />
      <div className="anim-fade-in-up relative w-full max-w-lg">
        <GlassPanel variant="strong" className="overflow-hidden p-0">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-white/5 p-4">
            <Search className="h-5 w-5 text-violet-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients by name, ID, or local ID..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
            />
            <button
              onClick={() => setSearchOpen(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto wope-scroll">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            )}
            {!loading && query && displayResults.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">No patients found for &quot;{query}&quot;</p>
              </div>
            )}
            {!loading && !query && (
              <div className="py-8 text-center">
                <Search className="mx-auto mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm text-slate-400">Start typing to search patients</p>
              </div>
            )}
            {!loading && displayResults.length > 0 && (
              <div className="p-2">
                {displayResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectPatient(p.id)}
                    className="row-slide flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-violet-500/8"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xs font-semibold text-violet-300">
                      {p.fullName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{p.fullName}</p>
                      <p className="truncate text-[11px] text-slate-400">
                        {p.localId} · {p.age ?? '?'}y · {p.gender.toLowerCase()} · {p.chiefComplaint ?? '—'}
                      </p>
                    </div>
                    <TriageBadge level={(p.vitals[0]?.triageLevel as 'GREEN' | 'YELLOW' | 'RED') ?? null} />
                    <ArrowRight className="h-4 w-4 text-slate-600" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
    </div>
  )
}
