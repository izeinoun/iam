// Members admin — shared reference data managed centrally from IAM.
// Members are referenced by every app (PayGuard for case routing, ClaimGuard
// for intake validation, SIU for FWA cases). The backend gates reads on
// `require_any_app("payguard","claimguard")` and writes on `require_role("admin")`.
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { api } from '../api'
import type { Member, MemberCreate } from '../api/types'

const LOB_OPTIONS = ['MA', 'Commercial', 'Medicaid', 'Medicare', 'Other']

const LOB_BADGE: Record<string, string> = {
  MA:         'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Commercial: 'bg-blue-50 text-blue-700 ring-blue-200',
  Medicaid:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Medicare:   'bg-amber-50 text-amber-700 ring-amber-200',
}

const PAGE_SIZE = 25

export default function MembersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [lob, setLob] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)

  // Debounce-free: a deliberately simple admin page; one round-trip per keystroke
  // on a list that's typically small. If membership scales >10k, add debouncing.
  const membersQ = useQuery({
    queryKey: ['members', page, search, lob],
    queryFn: () => api.listMembers({ page, pageSize: PAGE_SIZE, search, lob }),
  })

  const del = useMutation({
    mutationFn: (id: string) => api.deleteMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  })

  const total = membersQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  function onSearchChange(v: string) {
    setSearch(v)
    setPage(1)
  }
  function onLobChange(v: string) {
    setLob(v)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by member number or name…"
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <select
            value={lob}
            onChange={(e) => onLobChange(e.target.value)}
            className="px-2 py-2 border border-slate-200 rounded-md text-sm bg-white"
          >
            <option value="">All lines of business</option>
            {LOB_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-3 py-2 rounded-md"
        >
          <Plus className="w-4 h-4" /> New member
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="text-left font-medium px-4 py-2.5">Member #</th>
              <th className="text-left font-medium px-4 py-2.5">Name</th>
              <th className="text-left font-medium px-4 py-2.5">DOB</th>
              <th className="text-left font-medium px-4 py-2.5">LOB</th>
              <th className="text-left font-medium px-4 py-2.5">Coverage</th>
              <th className="text-right font-medium px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {membersQ.isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-slate-400 text-sm">Loading…</td></tr>
            )}
            {!membersQ.isLoading && (membersQ.data?.items.length ?? 0) === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-slate-400 text-sm italic">
                No members match this search.
              </td></tr>
            )}
            {membersQ.data?.items.map((m) => (
              <tr key={m.member_id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs text-slate-700">{m.member_number}</td>
                <td className="px-4 py-2.5">
                  <span className="text-slate-900 font-medium">{m.first_name} {m.last_name}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 tabular-nums">{m.date_of_birth}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ring-1 ${LOB_BADGE[m.lob] ?? 'bg-slate-50 text-slate-700 ring-slate-200'}`}>
                    {m.lob}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-600 text-xs tabular-nums">
                  {m.coverage_effective_date}
                  {m.coverage_termination_date ? <> → {m.coverage_termination_date}</> : <span className="text-slate-400"> → active</span>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => setEditing(m)}
                    className="text-slate-400 hover:text-indigo-600 p-1"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete member ${m.member_number} (${m.first_name} ${m.last_name})?\n\nThis cannot be undone. Existing claims that reference this member will be orphaned.`)) {
                        del.mutate(m.member_id)
                      }
                    }}
                    className="text-slate-400 hover:text-red-600 p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {page} of {totalPages} · {total} member{total === 1 ? '' : 's'} total
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2 py-1 border border-slate-200 rounded disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {(showForm || editing) && (
        <MemberFormModal
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['members'] }) }}
        />
      )}
    </div>
  )
}


// ── form modal ────────────────────────────────────────────────────────────

function MemberFormModal({
  initial, onClose, onSaved,
}: {
  initial?: Member
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!initial
  const [form, setForm] = useState<MemberCreate>({
    member_number: initial?.member_number ?? '',
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    date_of_birth: initial?.date_of_birth ?? '',
    lob: initial?.lob ?? 'Commercial',
    coverage_effective_date: initial?.coverage_effective_date ?? '',
    coverage_termination_date: initial?.coverage_termination_date ?? null,
  })
  const [error, setError] = useState<string | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      // Normalize empty termination to null so the API doesn't store ""
      const payload: MemberCreate = {
        ...form,
        coverage_termination_date: form.coverage_termination_date || null,
      }
      if (isEdit) return api.updateMember(initial!.member_id, payload)
      return api.createMember(payload)
    },
    onSuccess: onSaved,
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e)
      // axios surfaces the API detail in response.data.detail; pull through if present
      // @ts-expect-error duck-typed axios error
      const detail = e?.response?.data?.detail
      setError(typeof detail === 'string' ? detail : msg)
    },
  })

  const valid = (
    form.member_number.trim() && form.first_name.trim() &&
    form.last_name.trim() && form.date_of_birth &&
    form.lob && form.coverage_effective_date
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16">
      <div className="bg-white w-full max-w-xl rounded-lg shadow-xl">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-base font-semibold">
            {isEdit ? `Edit member ${initial!.member_number}` : 'New member'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Member number" required>
              <input
                value={form.member_number}
                onChange={(e) => setForm({ ...form, member_number: e.target.value })}
                placeholder="MA-000042"
                disabled={isEdit}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </Field>
            <Field label="Line of business" required>
              <select
                value={form.lob}
                onChange={(e) => setForm({ ...form, lob: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm bg-white"
              >
                {LOB_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="First name" required>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </Field>
            <Field label="Last name" required>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </Field>
          </div>

          <Field label="Date of birth" required>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-md text-sm"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Coverage effective" required>
              <input
                type="date"
                value={form.coverage_effective_date}
                onChange={(e) => setForm({ ...form, coverage_effective_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
              />
            </Field>
            <Field label="Coverage termination" hint="leave empty for active coverage">
              <input
                type="date"
                value={form.coverage_termination_date ?? ''}
                onChange={(e) => setForm({ ...form, coverage_termination_date: e.target.value || null })}
                className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm"
              />
            </Field>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 text-sm text-slate-600 hover:text-slate-900">
            Cancel
          </button>
          <button
            onClick={() => save.mutate()}
            disabled={!valid || save.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Create member'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, required, hint, children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-slate-400 font-normal italic ml-2">— {hint}</span>}
      </span>
      {children}
    </label>
  )
}
