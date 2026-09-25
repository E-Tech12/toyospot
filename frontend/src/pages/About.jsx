import Layout from '../components/Layout'

export default function About() {
  return (
    <Layout>
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
        <p className="text-sm font-semibold text-primary mb-3">Our story</p>
        <h1 className="font-display text-3xl sm:text-4xl font-medium leading-tight">
          Toyo&apos;s Pot started as one pot on one stove.
        </h1>
        <p className="text-muted mt-6 leading-relaxed">
          Toyo&apos;s Pot is a single kitchen, not a marketplace. Every meal on this menu is cooked in-house, the same
          way it always has been — fresh pepper blended daily, rice watched over pot by pot, soups that taste like
          they came from someone's kitchen, because they did.
        </p>
        <p className="text-muted mt-4 leading-relaxed">
          We built this platform so that ordering from us feels as reliable as the food itself: live stock so you
          never order something we've run out of, a direct line to the kitchen for special requests, and real-time
          tracking from the moment your order is accepted to the moment it's at your door.
        </p>

        <img src="/images/home.jpg" alt="Toyo's Pot kitchen" className="w-full rounded-xl2 mt-10 aspect-video object-cover" />

        <div className="grid sm:grid-cols-3 gap-6 mt-12">
          <div>
            <p className="font-display text-2xl font-semibold text-primary">1</p>
            <p className="text-sm font-semibold mt-1">Single kitchen</p>
            <p className="text-xs text-muted mt-1">Everything on the menu comes from Toyo&apos;s Pot, made the same way, every day.</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-primary">Live</p>
            <p className="text-sm font-semibold mt-1">Real inventory</p>
            <p className="text-xs text-muted mt-1">When we run out, the menu says so — no cancelled orders after the fact.</p>
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-primary">Direct</p>
            <p className="text-sm font-semibold mt-1">Order chat</p>
            <p className="text-xs text-muted mt-1">Talk to us about your specific order, from prep to delivery.</p>
          </div>
        </div>
      </section>
    </Layout>
  )
}
