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
import {
  listAssessments,
  launchCampaign,
  advanceCampaignPhase,
  closeCampaign,
  listCampaignSessions,
  getCampaignOverview,
} from '../api/assessments'

const EASE = [0.25, 0.46, 0.45, 0.94]
const titleCase = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

const TABS = [
  { key: 'assessment', label: 'Assessment' },
  { key: 'frameworks', label: 'Frameworks' },
  { key: 'regulations', label: 'Regulations' },
  { key: 'requests', label: 'Join Requests' },
  { key: 'invite', label: 'Invite Code' },
]

const scoreColor = (s) =>
  s == null ? 'text-white/40' : s >= 80 ? 'text-emerald-300' : s >= 40 ? 'text-amber-300' : 'text-red-300'
const fmtScore = (s) => (s == null ? '—' : `${Math.round(s)}%`)

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

// ─── Assessment campaign tab (admin-driven) ────────────────────────
const StatusBadge = ({ status, phase }) => {
  const map = {
    pending: 'bg-white/[0.06] text-white/60',
    in_progress: 'bg-[#2C74B3]/15 text-[#2C74B3]',
    completed: 'bg-emerald-500/15 text-emerald-300',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${map[status] || map.pending}`}>
      {titleCase(status)}{phase && status === 'in_progress' ? ` · ${titleCase(phase)}` : ''}
    </span>
  )
}

const CampaignTab = () => {
  const [assessments, setAssessments] = useState([])
  const [selected, setSelected] = useState(null)
  const [overview, setOverview] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const loadList = useCallback(async () => {
    try {
      const res = await listAssessments()
      const items = res?.data?.assessments || []
      setAssessments(items)
      setSelected((cur) => cur || (items[0]?.id ?? null))
    } catch {
      setAssessments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (id) => {
    if (!id) { setOverview(null); setSessions([]); return }
    try {
      const [ov, ss] = await Promise.all([getCampaignOverview(id), listCampaignSessions(id)])
      setOverview(ov?.data?.overview || null)
      setSessions(ss?.data?.sessions || [])
    } catch {
      setOverview(null); setSessions([])
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])
  useEffect(() => { loadDetail(selected) }, [selected, loadDetail])

  const act = async (fn) => {
    if (!selected) return
    setBusy(true); setError('')
    try {
      await fn(selected)
      await Promise.all([loadDetail(selected), loadList()])
    } catch (e) {
      setError(e?.response?.data?.detail || 'Action failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Spinner />

  if (assessments.length === 0) {
    return (
      <p className="text-sm text-white/40 py-10 text-center">
        No assessments yet. Create one from the AI Compliance chat to launch a campaign here.
      </p>
    )
  }

  const status = overview?.status
  const phase = overview?.current_phase
  const canLaunch = status === 'pending'
  const canAdvance = status === 'in_progress' && phase === 'baseline'
  const canClose = status === 'in_progress'

  return (
    <div>
      <p className="text-sm text-white/50 mb-5">
        Launch and control organization-wide assessments. Only you (admin) can start, advance, and close them —
        members answer their position-specific questions, and you see everyone's progress and scores here.
      </p>

      {/* Assessment selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {assessments.map((a) => (
          <button
            key={a.id}
            onClick={() => setSelected(a.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
              selected === a.id
                ? 'border-[#2C74B3]/50 bg-[#2C74B3]/15 text-white'
                : 'border-white/[0.06] bg-white/[0.02] text-white/55 hover:text-white/80'
            }`}
          >
            {a.name}
          </button>
        ))}
      </div>

      {overview && (
        <>
          {/* Before / After / Regulation scorecards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Framework · before</div>
              <div className={`text-3xl font-bold ${scoreColor(overview.baseline_score)}`}>{fmtScore(overview.baseline_score)}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Framework · after</div>
              <div className={`text-3xl font-bold ${scoreColor(overview.remediation_score)}`}>{fmtScore(overview.remediation_score)}</div>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4">
              <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Improvement</div>
              <div className={`text-3xl font-bold ${overview.improvement > 0 ? 'text-emerald-300' : overview.improvement < 0 ? 'text-red-300' : 'text-white/40'}`}>
                {overview.improvement == null ? '—' : `${overview.improvement > 0 ? '+' : ''}${Math.round(overview.improvement)}%`}
              </div>
            </div>
            <div className="rounded-xl border border-[#2C74B3]/20 bg-[#2C74B3]/[0.05] p-4">
              <div className="text-[10px] text-[#5F9BD8] uppercase tracking-wider mb-1">Regulation{overview.region ? ` · ${overview.region}` : ''}</div>
              <div className={`text-3xl font-bold ${scoreColor(overview.regulation_score)}`}>{fmtScore(overview.regulation_score)}</div>
            </div>
          </div>

          {/* Status + participation */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={status} phase={phase} />
                {overview.framework_name && <span className="text-xs text-white/45">{overview.framework_name}</span>}
              </div>
              <span className="text-xs text-white/50">
                {overview.completed_sessions}/{overview.participants_total} members done · {Math.round(overview.completion_rate)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-[#2C74B3] rounded-full transition-all" style={{ width: `${Math.min(100, overview.completion_rate)}%` }} />
            </div>
          </div>

          {error && <div className="mb-4 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</div>}

          {/* Controls */}
          <div className="flex flex-wrap gap-2 mb-6">
            {canLaunch && (
              <button onClick={() => act(launchCampaign)} disabled={busy}
                className="px-4 py-2 text-xs rounded-lg bg-[#2C74B3]/20 text-[#2C74B3] border border-[#2C74B3]/30 hover:bg-[#2C74B3]/30 transition-colors disabled:opacity-50">
                {busy ? '...' : '▶ Launch Campaign'}
              </button>
            )}
            {canAdvance && (
              <button onClick={() => act(advanceCampaignPhase)} disabled={busy}
                className="px-4 py-2 text-xs rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/25 hover:bg-amber-500/25 transition-colors disabled:opacity-50">
                {busy ? '...' : '⤴ Advance to Remediation'}
              </button>
            )}
            {canClose && (
              <button onClick={() => act(closeCampaign)} disabled={busy}
                className="px-4 py-2 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors disabled:opacity-50">
                {busy ? '...' : '■ Close Campaign'}
              </button>
            )}
            {status === 'completed' && (
              <span className="px-4 py-2 text-xs rounded-lg bg-emerald-500/10 text-emerald-300/80 border border-emerald-500/20">
                ✓ Completed — final score {fmtScore(overview.overall_score)}
              </span>
            )}
          </div>
        </>
      )}

      {/* Member sessions */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 bg-white/[0.02] text-[10px] text-white/40 uppercase tracking-wider grid grid-cols-12 gap-2">
          <span className="col-span-4">Member</span>
          <span className="col-span-3">Position</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1 text-right">Answers</span>
          <span className="col-span-2 text-right">Avg score</span>
        </div>
        {sessions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-white/40">No member sessions yet.</div>
        ) : (
          sessions.map((s) => (
            <div key={s.session_id} className="px-4 py-3 grid grid-cols-12 gap-2 items-center border-t border-white/[0.04]">
              <div className="col-span-4 min-w-0">
                <div className="text-sm text-white truncate">{s.user_full_name || s.user_email}</div>
                {s.user_full_name && <div className="text-[11px] text-white/35 truncate">{s.user_email}</div>}
              </div>
              <div className="col-span-3 text-xs text-white/55 truncate">{s.position_name || '—'}</div>
              <div className="col-span-2"><StatusBadge status={s.status} phase={s.phase} /></div>
              <div className="col-span-1 text-right text-xs text-white/55">{s.answers_count}</div>
              <div className={`col-span-2 text-right text-sm font-semibold ${scoreColor(s.avg_score)}`}>{fmtScore(s.avg_score)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Admin Panel ───────────────────────────────────────────────────
const AdminPanel = () => {
  const [tab, setTab] = useState('assessment')

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
            {tab === 'assessment' && <CampaignTab />}
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
