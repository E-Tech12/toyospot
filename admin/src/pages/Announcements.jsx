import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { FormField, TextAreaField } from '../components/FormField'
import { announcementApi } from '../lib/endpoints'
import { formatDateTime } from '../lib/format'
import { ApiError } from '../lib/api'

const SUGGESTIONS = ['We are closed today.', 'Free delivery today.', 'New meals available.']

export default function Announcements() {
  const [past, setPast] = useState(null)
  const [form, setForm] = useState({ title: '', body: '' })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () => announcementApi.list().then(setPast).catch(() => setPast([]))

  useEffect(load, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!form.title || !form.body) {
      setError('Fill in a title and message.')
      return
    }
    setSending(true)
    try {
      const res = await announcementApi.create(form.title, form.body)
      setSuccess(res.message)
      setForm({ title: '', body: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send this announcement.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Layout title="Announcements">
      <div className="grid lg:grid-cols-[1fr,1fr] gap-8">
        <div className="bg-surface border border-border rounded-xl2 p-6 h-fit">
          <h2 className="font-semibold mb-1">Send to every customer</h2>
          <p className="text-sm text-muted mb-4">Delivered as an in-app notification and a push notification.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="We are closed today." />
            <TextAreaField
              label="Message"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={3}
              placeholder="Give customers a bit more detail here."
            />
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm({ title: s, body: form.body || s })}
                  className="text-xs px-2.5 py-1 rounded-full border border-border text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            {success && <p className="text-sm text-success">{success}</p>}
            <Button type="submit" loading={sending}>Send announcement</Button>
          </form>
        </div>

        <div>
          <h2 className="font-semibold mb-3">Past announcements</h2>
          {past === null ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : past.length === 0 ? (
            <p className="text-sm text-muted">Nothing sent yet.</p>
          ) : (
            <div className="space-y-3">
              {past.map((a) => (
                <div key={a.id} className="bg-surface border border-border rounded-xl2 p-4">
                  <p className="font-medium text-sm">{a.title}</p>
                  <p className="text-sm text-muted mt-1">{a.body}</p>
                  <p className="text-xs text-muted/70 mt-2">{formatDateTime(a.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
