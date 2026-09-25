import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import FoodCard from '../components/FoodCard'
import CategoryPills from '../components/CategoryPills'
import StarRating from '../components/StarRating'
import { REVIEWS } from '../mock/data'
import { catalogApi } from '../lib/endpoints'
import { useCategories } from '../context/CategoriesContext'

const steps = [
  { title: 'Choose your meal', desc: "Browse rice dishes, soups, swallows and more, all cooked fresh at Toyo's Pot." },
  { title: 'Place your order', desc: 'Add delivery notes like spice level or gate details, then check out.' },
  { title: 'We prepare it', desc: 'Your meal is cooked to order and packed hot, ready for pickup by your rider.' },
  { title: 'Delivered to you', desc: 'Track it live and chat with us the whole way, right up to your door.' }
]

function FoodGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl2 border border-border overflow-hidden">
          <div className="aspect-[4/3] bg-border animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-border rounded animate-pulse w-3/4" />
            <div className="h-3 bg-border rounded animate-pulse w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Home() {
  const { categories } = useCategories()
  const [featured, setFeatured] = useState(null)
  const [popular, setPopular] = useState(null)

  useEffect(() => {
    catalogApi.listFeatured().then(setFeatured).catch(() => setFeatured([]))
    catalogApi.listPopular().then(setPopular).catch(() => setPopular([]))
  }, [])

  return (
    <Layout>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-14 grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
        <div>
          <p className="text-sm font-semibold text-primary mb-4">Homemade Nigerian meals, cooked daily</p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-medium leading-[1.08] tracking-tight">
            One kitchen. One standard.
            <br />
            Every plate from Toyo&apos;s Pot.
          </h1>
          <p className="mt-5 text-muted text-base sm:text-lg max-w-md leading-relaxed">
            No aggregators, no guesswork — just Toyo&apos;s own jollof, soups and swallows, made fresh and delivered
            while it&apos;s still hot.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/menu" className="bg-primary text-white text-sm font-semibold px-6 py-3.5 rounded-full hover:bg-primary-dark transition-colors">
              Order now
            </Link>
            <Link to="/about" className="text-sm font-semibold px-6 py-3.5 rounded-full border border-border hover:border-ink/30 transition-colors">
              How it works
            </Link>
          </div>
          <div className="mt-10 flex items-center gap-8">
            <div>
              <p className="font-display text-2xl font-semibold">25–35 min</p>
              <p className="text-xs text-muted mt-0.5">Average delivery time</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div>
              <p className="font-display text-2xl font-semibold">4.8/5</p>
              <p className="text-xs text-muted mt-0.5">From 1,200+ orders</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-xl2 overflow-hidden shadow-warm">
            <img src="/images/jollof.jpg" alt="Jollof rice from Toyo's Pot" className="w-full aspect-[4/5] object-cover" />
          </div>
          <div className="hidden sm:flex absolute -bottom-6 -left-6 bg-surface rounded-xl2 shadow-warm p-4 items-center gap-3 border border-border">
            <img src="/images/shawarma.jpg" alt="" className="w-14 h-14 rounded-lg object-cover" />
            <div>
              <p className="text-sm font-semibold leading-tight">Chicken Shawarma</p>
              <p className="text-xs text-muted">Just ordered · Lekki</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <CategoryPills />
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-medium">Featured this week</h2>
            <p className="text-muted text-sm mt-1">Handpicked from today&apos;s kitchen.</p>
          </div>
          <Link to="/menu" className="text-sm font-semibold text-primary hidden sm:block">
            View full menu →
          </Link>
        </div>
        {featured === null ? (
          <FoodGridSkeleton />
        ) : featured.length === 0 ? (
          <p className="text-sm text-muted">No featured meals right now — check the full menu.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {featured.map((f) => (
              <FoodCard key={f.id} food={f} />
            ))}
          </div>
        )}
      </section>

      {/* Popular */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
          <div className="mb-6">
            <h2 className="font-display text-2xl sm:text-3xl font-medium">Most ordered meals</h2>
            <p className="text-muted text-sm mt-1">What Toyo&apos;s Pot customers keep coming back for.</p>
          </div>
          {popular === null ? (
            <FoodGridSkeleton />
          ) : popular.length === 0 ? (
            <p className="text-sm text-muted">Nothing to rank yet — be the first to order!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {popular.map((f) => (
                <FoodCard key={f.id} food={f} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-medium mb-10 text-center">How it works</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center sm:text-left">
              <span className="font-display text-3xl text-primary/40 font-medium">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="font-semibold mt-2">{s.title}</h3>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-ink text-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="font-display text-2xl sm:text-3xl font-medium mb-10">What customers are saying</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {REVIEWS.map((r) => (
              <div key={r.id} className="bg-white/5 rounded-xl2 p-6 border border-white/10">
                <StarRating rating={r.rating} />
                <p className="mt-3 text-sm leading-relaxed text-cream/90">&ldquo;{r.text}&rdquo;</p>
                <p className="mt-4 text-sm font-semibold">{r.name}</p>
                <p className="text-xs text-cream/60">Ordered {r.meal}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category grid footer teaser */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="font-display text-2xl sm:text-3xl font-medium mb-8">Explore the full menu</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/menu/${c.slug}`}
              className="bg-primary-light/50 hover:bg-primary-light rounded-xl2 p-6 text-center transition-colors"
            >
              <span className="text-3xl" aria-hidden="true">{c.icon}</span>
              <p className="font-semibold mt-2 text-sm">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>
    </Layout>
  )
}
