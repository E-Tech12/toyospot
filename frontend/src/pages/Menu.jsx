import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import CategoryPills from '../components/CategoryPills'
import FoodCard from '../components/FoodCard'
import { catalogApi } from '../lib/endpoints'
import { useCategories } from '../context/CategoriesContext'

export default function Menu() {
  const { slug } = useParams()
  const { categories } = useCategories()
  const [query, setQuery] = useState('')
  const [foods, setFoods] = useState(null)

  const category = categories.find((c) => c.slug === slug)

  useEffect(() => {
    setFoods(null)
    // Debounce search-as-you-type; category changes fetch immediately.
    const handle = setTimeout(
      () => {
        catalogApi
          .listFoods({ category: slug, search: query.trim() || undefined })
          .then(setFoods)
          .catch(() => setFoods([]))
      },
      query ? 300 : 0
    )
    return () => clearTimeout(handle)
  }, [slug, query])

  return (
    <Layout>
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-6">
        <h1 className="font-display text-3xl sm:text-4xl font-medium">{category ? category.name : 'Our Menu'}</h1>
        <p className="text-muted text-sm mt-2">Cooked fresh at Toyo&apos;s Pot, ready in 10–35 minutes.</p>

        <div className="mt-6 relative max-w-md">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search meals or drinks..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-border text-sm bg-surface focus:border-primary transition-colors"
          />
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4">
        <CategoryPills activeSlug={slug} />
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {foods === null ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl2 border border-border overflow-hidden">
                <div className="aspect-[4/3] bg-border animate-pulse" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-border rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-border rounded animate-pulse w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-20">
            <p className="font-display text-xl">No meals match your search</p>
            <p className="text-sm text-muted mt-2">Try a different keyword or browse another category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {foods.map((f) => (
              <FoodCard key={f.id} food={f} />
            ))}
          </div>
        )}
      </section>
    </Layout>
  )
}
