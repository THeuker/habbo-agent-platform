import { useState, useEffect, useCallback } from 'react'
import { HabboFigure } from './HabboFigure'
import { friendlyFetchError } from '../utils/fetchError'
import {
  Package, Users, User, Check, Loader2, AlertCircle, Download, ChevronDown, ChevronUp,
  Sparkles, BookOpen, ListTodo, MessageSquare, Workflow, LayoutGrid,
} from 'lucide-react'

/** Split stored capabilities (comma / newline / semicolon) into skill chips */
function parseCapabilityList(cap) {
  if (cap == null || cap === '') return []
  return String(cap).split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
}

/**
 * Normalize tasks_json: strings or { id, title, name, description, ... } objects.
 */
function normalizeTeamTasks(raw) {
  if (raw == null || raw === '') return []
  try {
    const j = typeof raw === 'string' ? JSON.parse(raw) : raw
    const list = Array.isArray(j) ? j : j && typeof j === 'object' ? [j] : []
    return list.map((item, idx) => {
      if (typeof item === 'string') {
        return { key: `t-${idx}`, title: item, description: '', id: null }
      }
      if (item && typeof item === 'object') {
        const title = item.title || item.name || item.label || `Task ${idx + 1}`
        const description =
          item.description ?? item.detail ?? item.body ?? item.summary ?? ''
        return {
          key: item.id != null ? `id-${item.id}` : `t-${idx}`,
          id: item.id != null ? String(item.id) : null,
          title: String(title),
          description: typeof description === 'string' ? description : String(description ?? ''),
        }
      }
      return { key: `t-${idx}`, title: String(item), description: '', id: null }
    })
  } catch {
    return []
  }
}

function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="w-3.5 h-3.5 opacity-80 shrink-0" aria-hidden />}
      {children}
    </div>
  )
}

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

function TeamCard({ team, installed, installing, onInstall, disabled }) {
  const [expanded, setExpanded] = useState(false)
  const members = team.members || []
  const teamTasks = normalizeTeamTasks(team.tasks_json)
  const flows = team.flows || []

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{team.name}</h3>
            {team.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{team.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                {team.execution_mode || 'concurrent'}
              </span>
              <span className="text-[10px] text-muted-foreground">
                <Users className="w-3 h-3 inline mr-1" />
                {members.length} {members.length === 1 ? 'agent' : 'agents'}
              </span>
            </div>
          </div>
          <div className="flex-shrink-0">
            {installed ? (
              <span className="inline-flex items-center gap-1 text-xs text-success bg-success/10 px-2.5 py-1.5 rounded-lg">
                <Check className="w-3 h-3" /> Installed
              </span>
            ) : (
              <button
                onClick={onInstall}
                disabled={disabled || installing}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {installing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Download className="w-3 h-3" />
                )}
                {disabled ? 'Pro Required' : installing ? 'Installing...' : 'Install'}
              </button>
            )}
          </div>
        </div>

        {/* Agent names (no initials — list who is in the team) */}
        {members.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 mr-2">Agents</span>
            {members
              .map((m) => (m.name || '').trim())
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}

        {/* Expand details */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-muted-foreground hover:text-foreground mt-3 flex items-center gap-1"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Hide' : 'Show'} full details
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border bg-gradient-to-b from-muted/30 to-muted/10 p-4 space-y-5 text-left">
          {/* Team overview */}
          <div className="rounded-xl border border-border/80 bg-card/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex items-center gap-2">
              <LayoutGrid className="w-4 h-4 text-primary shrink-0" aria-hidden />
              <span className="text-sm font-semibold text-foreground">Team overview</span>
            </div>
            <div className="p-4 space-y-4">
              {team.description?.trim() && (
                <div>
                  <SectionLabel>About</SectionLabel>
                  <p className="text-sm text-foreground/90 leading-relaxed mt-2">{team.description}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/80">Language</span>
                  {(team.language || 'en').toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground/80">Mode</span>
                  <span className="capitalize">{team.execution_mode || 'concurrent'}</span>
                </span>
              </div>
              {team.orchestrator_prompt?.trim() && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <SectionLabel icon={MessageSquare}>Orchestrator</SectionLabel>
                  <div className="text-xs text-foreground/85 leading-relaxed mt-2 max-h-44 overflow-y-auto whitespace-pre-wrap">
                    {team.orchestrator_prompt}
                  </div>
                </div>
              )}
              {teamTasks.length > 0 && (
                <div>
                  <SectionLabel icon={ListTodo}>Team tasks</SectionLabel>
                  <ul className="mt-3 space-y-2">
                    {teamTasks.map((task) => (
                      <li
                        key={task.key}
                        className="rounded-lg border border-border/70 bg-background/60 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                          {task.id && (
                            <span className="shrink-0 text-[10px] font-mono text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                              {task.id}
                            </span>
                          )}
                        </div>
                        {task.description?.trim() && (
                          <p className="text-xs text-muted-foreground leading-relaxed mt-2 border-t border-border/40 pt-2">
                            {task.description}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {flows.length > 0 && (
                <div>
                  <SectionLabel icon={Workflow}>Flows</SectionLabel>
                  <ul className="mt-3 space-y-2">
                    {flows.map((f, i) => (
                      <li
                        key={f.id ?? i}
                        className="rounded-lg border border-border/70 bg-background/50 px-3 py-2.5"
                      >
                        <p className="text-sm font-medium text-foreground">{f.name}</p>
                        {f.description?.trim() && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.description}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Members */}
          {members.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-0.5">
                <Users className="w-4 h-4 text-primary shrink-0" aria-hidden />
                <span className="text-sm font-semibold text-foreground">Agents</span>
                <span className="text-xs text-muted-foreground">({members.length})</span>
              </div>
              {members.map((m, i) => {
                const skills = parseCapabilityList(m.capabilities)
                return (
                  <div
                    key={m.id ?? m.persona_id ?? i}
                    className="rounded-xl border border-border/80 bg-card/90 shadow-sm p-4 space-y-3"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-9 h-9 rounded-full bg-muted/60 overflow-hidden flex items-center justify-center flex-shrink-0 text-muted-foreground">
                        {m.figure ? (
                          <HabboFigure figure={m.figure} headOnly size={36} />
                        ) : (
                          <User className="w-4 h-4 opacity-70" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {m.role?.trim() && (
                            <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded">
                              Team role: {m.role}
                            </span>
                          )}
                          {m.persona_role?.trim() && (
                            <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                              Persona: {m.persona_role}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {skills.length > 0 && (
                      <div>
                        <SectionLabel icon={Sparkles}>Skills &amp; capabilities</SectionLabel>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {skills.map((s, j) => (
                            <span
                              key={j}
                              className="text-[11px] bg-primary/10 text-foreground/90 px-2.5 py-1 rounded-full border border-primary/15"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.capabilities?.trim() && skills.length === 0 && (
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{m.capabilities}</p>
                    )}
                    {m.prompt?.trim() && (
                      <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                        <SectionLabel icon={BookOpen}>Behavior &amp; instructions</SectionLabel>
                        <div className="text-[11px] text-foreground/85 leading-relaxed mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {m.prompt}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function MarketplaceView({ me }) {
  const [teams, setTeams] = useState([])
  const [installedIds, setInstalledIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [installingId, setInstallingId] = useState(null)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [td, id] = await Promise.all([
        api('/api/agents/teams'),
        api('/api/my/installed-team-ids'),
      ])
      // Fetch members for each team
      const teamsWithMembers = await Promise.all(
        (td.teams || []).map(async (t) => {
          try {
            const detail = await api(`/api/agents/teams/${t.id}`)
            const d = detail.team || {}
            return { ...t, ...d, members: d.members || [] }
          } catch {
            return { ...t, members: [] }
          }
        })
      )
      setTeams(teamsWithMembers)
      setInstalledIds(id.installed || [])
    } catch (e) {
      setError(friendlyFetchError(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function installTeam(teamId) {
    setInstallingId(teamId)
    try {
      await api(`/api/marketplace/teams/${teamId}/install`, { method: 'POST' })
      setInstalledIds(prev => [...prev, teamId])
      showToast('Team installed! Go to My Agents to configure bots and deploy.')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setInstallingId(null)
    }
  }

  const isBasic = me?.ai_tier === 'basic'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-center">
        <AlertCircle className="w-5 h-5 text-destructive mx-auto mb-2" />
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-foreground">Marketplace</h2>
        <p className="text-sm text-muted-foreground">Browse and install agent teams. After installing, configure bots in My Agents.</p>
      </div>

      {isBasic && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-warning/80 font-medium">Pro tier required</p>
            <p className="text-xs text-warning/80/70 mt-0.5">Upgrade to Pro to install and deploy agent teams.</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`rounded-lg px-4 py-2.5 text-sm ${toast.type === 'error' ? 'bg-destructive/10 text-destructive/80 border border-destructive/30' : 'bg-success/10 text-success border border-success/30'}`}>
          {toast.msg}
        </div>
      )}

      {/* Team grid */}
      {teams.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <Package className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No teams in marketplace yet</p>
          <p className="text-xs text-muted-foreground mt-1">Developers can create teams from the Developer tab.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              installed={installedIds.includes(team.id)}
              installing={installingId === team.id}
              onInstall={() => installTeam(team.id)}
              disabled={isBasic}
            />
          ))}
        </div>
      )}
    </div>
  )
}
