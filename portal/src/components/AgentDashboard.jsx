import { useState, useEffect, useCallback } from 'react'
import { HabboFigure } from './HabboFigure'
import {
  Bot, Package, Play, Edit2, Trash2, Plus, X, Check,
  Loader2, AlertCircle, Users,
} from 'lucide-react'

// ── API helper ────────────────────────────────────────────────────────────

async function api(url, opts = {}) {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

// ── Main Dashboard Component ───────────────────────────────────────────────

export function AgentDashboard({ me }) {
  const [tab, setTab] = useState('packs')

  const tabs = [
    { id: 'packs', label: 'Packs', icon: Package },
    { id: 'integrated', label: 'Integrated', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-semibold text-sm text-foreground">Agent Command Center</h1>
            <p className="text-xs text-muted-foreground">Orchestration Hub</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {me?.figure && <HabboFigure figure={me.figure} size="sm" animate={false} />}
            <span className="text-sm text-muted-foreground">{me?.habbo_username}</span>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 pb-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'packs' && <PacksView />}
        {tab === 'integrated' && <IntegratedView />}
      </div>
    </div>
  )
}

// ── Packs View ────────────────────────────────────────────────────────────

function PacksView() {
  const [packs, setPacks] = useState([])
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPack, setEditingPack] = useState(null) // null | pack object
  const [runningIds, setRunningIds] = useState(new Set())
  const [toast, setToast] = useState(null) // { msg, type }

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pd, bd] = await Promise.all([
        api('/api/agents/packs'),
        api('/api/agents/bots'),
      ])
      setPacks(pd.packs || [])
      setBots(bd.bots || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function runPack(pack) {
    setRunningIds(prev => new Set([...prev, pack.id]))
    try {
      await api(`/api/agents/packs/${pack.id}/trigger`, { method: 'POST' })
      showToast(`Pack "${pack.name}" triggered successfully.`)
    } catch (e) {
      showToast(`Failed to run pack: ${e.message}`, 'error')
    } finally {
      setRunningIds(prev => {
        const next = new Set(prev)
        next.delete(pack.id)
        return next
      })
    }
  }

  async function deletePack(pack) {
    if (!confirm(`Delete pack "${pack.name}"?`)) return
    // Optimistic remove
    setPacks(prev => prev.filter(p => p.id !== pack.id))
    try {
      await api(`/api/agents/packs/${pack.id}`, { method: 'DELETE' })
    } catch (e) {
      showToast(`Delete failed: ${e.message}`, 'error')
      load()
    }
  }

  function openNewForm() {
    setEditingPack(null)
    setShowForm(true)
  }

  function openEditForm(pack) {
    setEditingPack(pack)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingPack(null)
  }

  async function savePack(data) {
    if (editingPack) {
      await api(`/api/agents/packs/${editingPack.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } else {
      await api('/api/agents/packs', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }
    closeForm()
    load()
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
          toast.type === 'error'
            ? 'bg-destructive/10 border border-destructive/30 text-destructive'
            : 'bg-green-500/10 border border-green-500/30 text-green-400'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4 flex-shrink-0" /> : <Check className="w-4 h-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Packs</h2>
        {!showForm && (
          <button
            onClick={openNewForm}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Pack
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <PackForm
          pack={editingPack}
          bots={bots}
          onSave={savePack}
          onCancel={closeForm}
        />
      )}

      {/* Cards grid */}
      {packs.length === 0 && !showForm ? (
        <EmptyState icon={Package} title="No packs yet" description="Create your first pack to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packs.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              running={runningIds.has(pack.id)}
              onRun={() => runPack(pack)}
              onEdit={() => openEditForm(pack)}
              onDelete={() => deletePack(pack)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Pack Card ─────────────────────────────────────────────────────────────

function PackCard({ pack, running, onRun, onEdit, onDelete }) {
  const sourceDisplay = pack.pack_source_url
    ? pack.pack_source_url.length > 40
      ? pack.pack_source_url.slice(0, 37) + '...'
      : pack.pack_source_url
    : null

  const assignments = Array.isArray(pack.role_assignments) ? pack.role_assignments : []

  return (
    <div className="relative flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
      {/* Edit / Delete buttons top-right */}
      <div className="absolute top-3 right-3 flex gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Edit pack"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete pack"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Top */}
      <div className="flex items-start gap-3 pr-16">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Package className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm text-foreground">{pack.name}</p>
          {pack.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{pack.description}</p>
          )}
        </div>
      </div>

      {/* Source */}
      {sourceDisplay && (
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/60 mr-1">Source</span>
          <span className="font-mono">{sourceDisplay}</span>
        </div>
      )}

      {/* Role assignments */}
      {assignments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assignments.map((a, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full"
            >
              <span className="text-muted-foreground">{a.role}</span>
              <span className="text-muted-foreground">→</span>
              <span className="font-medium">{a.bot_name}</span>
            </span>
          ))}
        </div>
      )}

      {/* Room badge */}
      {pack.room_id && (
        <div>
          <span className="inline-flex items-center text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
            Room {pack.room_id}
          </span>
        </div>
      )}

      {/* Run button */}
      <button
        onClick={onRun}
        disabled={running}
        className="mt-auto flex items-center justify-center gap-1.5 text-xs bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {running ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Running...
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" /> Run
          </>
        )}
      </button>
    </div>
  )
}

// ── Pack Form ─────────────────────────────────────────────────────────────

function PackForm({ pack, bots, onSave, onCancel }) {
  const [name, setName] = useState(pack?.name || '')
  const [description, setDescription] = useState(pack?.description || '')
  const [roomId, setRoomId] = useState(pack?.room_id ?? 202)
  const [sourceUrl, setSourceUrl] = useState(pack?.pack_source_url || '')
  const [assignments, setAssignments] = useState(
    Array.isArray(pack?.role_assignments) && pack.role_assignments.length > 0
      ? pack.role_assignments.map(a => ({ role: a.role || '', bot_name: a.bot_name || '' }))
      : [{ role: '', bot_name: '' }]
  )
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  function addAssignment() {
    setAssignments(prev => [...prev, { role: '', bot_name: '' }])
  }

  function removeAssignment(i) {
    setAssignments(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateAssignment(i, field, value) {
    setAssignments(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }

  async function handleSave() {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        room_id: Number(roomId),
        pack_source_url: sourceUrl.trim(),
        role_assignments: assignments.filter(a => a.role.trim()),
      })
    } catch (e) {
      setFormError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-sm text-foreground">{pack ? 'Edit Pack' : 'New Pack'}</h3>

      {formError && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="My Pack"
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Room ID</label>
          <input
            type="number"
            value={roomId}
            onChange={e => setRoomId(e.target.value)}
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Description</label>
        <input
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What does this pack do?"
          className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Pack Source URL</label>
        <input
          value={sourceUrl}
          onChange={e => setSourceUrl(e.target.value)}
          placeholder="https://raw.githubusercontent.com/.../orchestrator.md"
          className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
        />
      </div>

      {/* Role assignments */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-foreground">Role Assignments</label>
        {assignments.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={a.role}
              onChange={e => updateAssignment(i, 'role', e.target.value)}
              placeholder="researcher"
              className="flex-1 text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <span className="text-muted-foreground text-sm flex-shrink-0">→</span>
            <select
              value={a.bot_name}
              onChange={e => updateAssignment(i, 'bot_name', e.target.value)}
              className="flex-1 text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Select bot…</option>
              {bots.map(b => (
                <option key={b.id ?? b.name} value={b.name}>{b.name}</option>
              ))}
            </select>
            <button
              onClick={() => removeAssignment(i)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={addAssignment}
          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add Role
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs border border-border px-4 py-2 rounded-md hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Integrated View ───────────────────────────────────────────────────────

function IntegratedView() {
  const [personas, setPersonas] = useState([])
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPersona, setEditingPersona] = useState(null) // null | persona object

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [pd, bd] = await Promise.all([
        api('/api/agents/personas'),
        api('/api/agents/bots'),
      ])
      setPersonas(pd.personas || [])
      setBots(bd.bots || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function deletePersona(persona) {
    if (!confirm(`Delete agent "${persona.name}"?`)) return
    setPersonas(prev => prev.filter(p => p.id !== persona.id))
    try {
      await api(`/api/agents/personas/${persona.id}`, { method: 'DELETE' })
    } catch (e) {
      load()
    }
  }

  function openNewForm() {
    setEditingPersona(null)
    setShowForm(true)
  }

  function openEditForm(persona) {
    setEditingPersona(persona)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingPersona(null)
  }

  async function savePersona(data) {
    if (editingPersona) {
      await api(`/api/agents/personas/${editingPersona.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
    } else {
      await api('/api/agents/personas', {
        method: 'POST',
        body: JSON.stringify(data),
      })
    }
    closeForm()
    load()
  }

  if (loading) return <LoadingState />
  if (error) return <ErrorBanner message={error} onRetry={load} />

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Integrated Agents</h2>
        {!showForm && (
          <button
            onClick={openNewForm}
            className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Agent
          </button>
        )}
      </div>

      {/* Inline form */}
      {showForm && (
        <PersonaEditor
          persona={editingPersona}
          bots={bots}
          onSave={savePersona}
          onCancel={closeForm}
        />
      )}

      {/* List */}
      {personas.length === 0 && !showForm ? (
        <EmptyState icon={Users} title="No agents yet" description="Add your first integrated agent to get started" />
      ) : (
        <div className="space-y-3">
          {personas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onEdit={() => openEditForm(persona)}
              onDelete={() => deletePersona(persona)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Persona Card ──────────────────────────────────────────────────────────

function PersonaCard({ persona, onEdit, onDelete }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      {/* Avatar */}
      <HabboFigure figure={persona.figure || null} size="md" animate={true} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground">{persona.name}</p>
        {persona.role && (
          <p className="text-xs text-muted-foreground mt-0.5">{persona.role}</p>
        )}
        {(persona.prompt || persona.description || persona.motto) && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {persona.prompt || persona.description || persona.motto}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {persona.bot_name && (
          <span className="inline-flex items-center text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
            {persona.bot_name}
          </span>
        )}
        {persona.room_id && (
          <span className="inline-flex items-center text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
            Room {persona.room_id}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Edit agent"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          title="Delete agent"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Persona Editor ────────────────────────────────────────────────────────

function PersonaEditor({ persona, bots, onSave, onCancel }) {
  const [name, setName] = useState(persona?.name || '')
  const [role, setRole] = useState(persona?.role || '')
  const [prompt, setPrompt] = useState(persona?.prompt || persona?.description || '')
  const [botName, setBotName] = useState(persona?.bot_name || '')
  const [figure, setFigure] = useState(persona?.figure || '')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  async function handleSave() {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        name: name.trim(),
        role: role.trim(),
        prompt: prompt.trim(),
        bot_name: botName,
        figure: figure.trim(),
      })
    } catch (e) {
      setFormError(e.message)
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="font-semibold text-sm text-foreground">{persona ? 'Edit Agent' : 'New Agent'}</h3>

      {formError && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-lg">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {formError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Agent name"
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Role</label>
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="e.g. researcher"
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-foreground">Personality &amp; Instructions</label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Describe this agent's personality, goals, and instructions…"
          rows={4}
          className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Bot</label>
          <select
            value={botName}
            onChange={e => setBotName(e.target.value)}
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Select bot…</option>
            {bots.map(b => (
              <option key={b.id ?? b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-foreground">Habbo Figure</label>
          <input
            value={figure}
            onChange={e => setFigure(e.target.value)}
            placeholder="hr-115-42.hd-180-1.ch-…"
            className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
          />
        </div>
      </div>

      {/* Preview figure */}
      {figure && (
        <div className="flex items-center gap-3">
          <HabboFigure figure={figure} size="md" animate={true} />
          <p className="text-xs text-muted-foreground">Figure preview</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="text-xs border border-border px-4 py-2 rounded-md hover:bg-secondary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ── Shared UI Primitives ──────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-muted-foreground">
      <Loader2 className="w-6 h-6 animate-spin mr-2" />
      <span className="text-sm">Loading…</span>
    </div>
  )
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive">
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 text-sm">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs border border-destructive/40 px-3 py-1.5 rounded-md hover:bg-destructive/10 transition-colors flex-shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <p className="font-medium text-sm text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-xs">{description}</p>}
    </div>
  )
}
