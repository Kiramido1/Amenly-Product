import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getAvailableFrameworks, associateFrameworks, dissociateFramework } from '../api/frameworks'
import {
  getMyOrganization,
  getJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
  regenerateInviteCode,
} from '../api/organizations'

const EASE = [0.25, 0.46, 0.45, 0.94]
const titleCase = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const TABS = [
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'regulations', label: 'Regulations' },
  { key: 'requests', label: 'Join Requests' },
  { key: 'invite', label: 'Invite Code' },
]

// Catalog tab config: frameworks (standards/guidelines) vs regulations.
const CATALOG_KINDS = {
  frameworks: {
    keep: (fw) => fw.framework_type !== 'regulation',
    blurb: 'Choose the compliance frameworks & standards that apply to your organization.',
    empty: 'No frameworks available.',
  },
  regulations: {
    keep: (fw) => fw.framework_type === 'regulation',
    blurb: 'Add the regulations your organization must comply with.',
    empty: 'No regulations available.',
  },
}

const Spinner = () => (
  <div className="flex justify-center py-16">
    <div className="w-8 h-8 border-2 border-white/10 border-t-[#2C74B3] rounded-full animate-spin" />
  </div>
)

// ─── Catalog tab (frameworks / regulations) ────────────────────────
const CatalogTab = ({ kind }) => {
  const cfg = CATALOG_KINDS[kind]
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const all = await getAvailableFrameworks({ limit: 200 })
      setItems(all.filter(cfg.keep))
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [cfg])

  useEffect(() => { load() }, [load])

  const toggle = async (fw) => {
    setBusyId(fw.id)
    // optimistic flip
    setItems((prev) => prev.map((f) => (f.id === fw.id ? { ...f, is_associated: !f.is_associated } : f)))
    try {
      if (fw.is_associated) await dissociateFramework(fw.id)
      else await associateFrameworks([fw.id])
    } catch {
      load() // revert on failure
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner />

  const frameworks = items
  const addedCount = frameworks.filter((f) => f.is_associated).length

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-white/50">{cfg.blurb}</p>
        <span className="text-xs text-[#2C74B3] font-medium">{addedCount} selected</span>
      </div>

      {frameworks.length === 0 ? (
        <p className="text-sm text-white/40 py-8 text-center">{cfg.empty}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {frameworks.map((fw) => {
            const isReg = fw.framework_type === 'regulation'
            return (
              <motion.div
                key={fw.id}
                layout
                className={`rounded-xl border p-4 flex flex-col transition-colors ${
                  fw.is_associated
                    ? 'border-[#2C74B3]/40 bg-[#144272]/12'
                    : 'border-white/[0.06] bg-white/[0.015]'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-white leading-tight">{fw.name}</h3>
                  {fw.version && <span className="text-[10px] text-white/30 whitespace-nowrap">{fw.version}</span>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${isReg ? 'bg-violet-500/15 text-violet-300' : 'bg-[#2C74B3]/15 text-[#2C74B3]'}`}>
                    {titleCase(fw.framework_type)}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] text-white/40 bg-white/[0.04]">{titleCase(fw.category)}</span>
                  {fw.is_mandatory && <span className="px-2 py-0.5 rounded text-[10px] text-amber-300 bg-amber-500/10">Mandatory</span>}
                </div>
                {fw.region && <p className="text-[11px] text-white/35 mb-3">{fw.region}</p>}
                <button
                  onClick={() => toggle(fw)}
                  disabled={busyId === fw.id}
                  className={`mt-auto w-full py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-50 ${
                    fw.is_associated
                      ? 'bg-white/[0.04] text-white/60 border border-white/10 hover:text-red-300 hover:border-red-500/30'
                      : 'bg-[#2C74B3]/20 text-[#2C74B3] border border-[#2C74B3]/30 hover:bg-[#2C74B3]/30'
                  }`}
                >
                  {fw.is_associated ? 'Added ✓ — Remove' : '+ Add to organization'}
                </button>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Join Requests tab ─────────────────────────────────────────────
const RequestsTab = () => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setRequests(await getJoinRequests())
    } catch {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const decide = async (id, decision) => {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    try {
      decision === 'approve' ? await approveJoinRequest(id) : await rejectJoinRequest(id)
    } catch {
      load()
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <p className="text-sm text-white/50 mb-5">People asking to join your organization.</p>
      {requests.length === 0 ? (
        <p className="text-sm text-white/40 py-8 text-center">No pending requests.</p>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-4 bg-white/[0.015] rounded-xl border border-white/[0.06]">
              <div>
                <div className="text-sm font-medium text-white">{req.full_name || '—'}</div>
                <div className="text-sm text-white/45">{req.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => decide(req.id, 'approve')} className="px-3.5 py-1.5 text-xs rounded-lg bg-[#2C74B3]/20 text-[#2C74B3] border border-[#2C74B3]/30 hover:bg-[#2C74B3]/30 transition-colors">Approve</button>
                <button onClick={() => decide(req.id, 'reject')} className="px-3.5 py-1.5 text-xs rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 transition-colors">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Invite Code tab ───────────────────────────────────────────────
const InviteTab = () => {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getMyOrganization()
      .then((org) => setCode(org?.invite_code || ''))
      .catch(() => setCode(''))
      .finally(() => setLoading(false))
  }, [])

  const generate = async () => {
    try {
      setGenerating(true)
      setCode(await regenerateInviteCode())
      setCopied(false)
    } catch { /* ignore */ } finally {
      setGenerating(false)
    }
  }

  const copy = () => {
    if (!code) return
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-lg">
      <p className="text-sm text-white/50 mb-5">
        Share this <span className="text-white/70">single-use</span> code with one person you want to invite. It is
        consumed once they sign up; generate a new one for the next person.
      </p>
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-6">
        <div className="text-xs text-white/40 uppercase tracking-wider mb-2">Current invite code</div>
        {code ? (
          <div className="font-mono text-3xl text-[#2C74B3] tracking-[0.3em] mb-5">{code}</div>
        ) : (
          <div className="text-sm text-white/40 italic mb-5">No active code — generate one to invite someone.</div>
        )}
        <div className="flex gap-2">
          {code && (
            <button onClick={copy} className="px-4 py-2.5 text-xs rounded-lg border border-white/10 text-white/70 hover:text-white hover:border-[#2C74B3]/50 transition-colors">
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          )}
          <button onClick={generate} disabled={generating} className="px-4 py-2.5 text-xs rounded-lg bg-[#2C74B3]/20 text-[#2C74B3] border border-[#2C74B3]/30 hover:bg-[#2C74B3]/30 transition-colors disabled:opacity-50">
            {generating ? 'Generating...' : code ? 'Generate new code' : 'Generate code'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Admin Panel ───────────────────────────────────────────────────
const AdminPanel = () => {
  const [tab, setTab] = useState('frameworks')

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2C74B3]" />
              <span className="text-[#2C74B3] text-[10px] font-semibold uppercase tracking-widest">Admin Only</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          </div>
          <Link to="/dashboard" className="px-4 py-2 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/70 hover:text-white hover:border-[#2C74B3]/40 transition-all">
            ← Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 mb-8 rounded-xl bg-white/[0.03] border border-white/[0.06] w-full sm:w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none ${
                tab === t.key ? 'text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              {tab === t.key && (
                <motion.div layoutId="adminTab" className="absolute inset-0 rounded-lg bg-[#2C74B3]/25 border border-[#2C74B3]/40" transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {tab === 'frameworks' && <CatalogTab kind="frameworks" />}
            {tab === 'regulations' && <CatalogTab kind="regulations" />}
            {tab === 'requests' && <RequestsTab />}
            {tab === 'invite' && <InviteTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AdminPanel
