import { useState } from 'react'
import Layout from '../components/Layout'
import FormField from '../components/FormField'
import Button from '../components/Button'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 500))
    setLoading(false)
    setSent(true)
  }

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-14 grid md:grid-cols-2 gap-12">
        <div>
          <h1 className="font-display text-3xl font-medium">Get in touch</h1>
          <p className="text-muted mt-3 leading-relaxed">
            Questions about an order, catering, or just want to say hello? Reach us directly — for existing orders,
            the fastest way is the order chat in your dashboard.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <div>
              <p className="font-semibold">Phone</p>
              <p className="text-muted">+234 803 555 0192</p>
            </div>
            <div>
              <p className="font-semibold">Email</p>
              <p className="text-muted">hello@toyospot.ng</p>
            </div>
            <div>
              <p className="font-semibold">Hours</p>
              <p className="text-muted">9am – 9pm, daily</p>
            </div>
          </div>
        </div>

        <div>
          {sent ? (
            <div className="bg-primary-light/50 rounded-xl2 p-6 text-center">
              <p className="font-semibold">Message sent</p>
              <p className="text-sm text-muted mt-1.5">We'll get back to you within a few hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" />
              <FormField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
              <label className="block">
                <span className="block text-sm font-medium text-ink mb-1.5">Message</span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  placeholder="How can we help?"
                  className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm bg-surface placeholder:text-muted/70 focus:border-primary transition-colors resize-none"
                />
              </label>
              <Button type="submit" loading={loading} className="w-full">
                Send message
              </Button>
            </form>
          )}
        </div>
      </section>
    </Layout>
  )
}
