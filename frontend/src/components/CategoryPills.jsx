import { Link, useParams } from 'react-router-dom'
import { useCategories } from '../context/CategoriesContext'

export default function CategoryPills({ activeSlug }) {
  const { slug } = useParams()
  const current = activeSlug ?? slug
  const { categories, isLoading } = useCategories()

  if (isLoading) {
    return (
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="shrink-0 h-9 w-24 rounded-full bg-border animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
      <Link
        to="/menu"
        className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
          !current ? 'bg-ink text-white border-ink' : 'bg-surface text-ink/70 border-border hover:border-ink/30'
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          to={`/menu/${c.slug}`}
          className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
            current === c.slug ? 'bg-ink text-white border-ink' : 'bg-surface text-ink/70 border-border hover:border-ink/30'
          }`}
        >
          <span aria-hidden="true">{c.icon}</span>
          {c.name}
        </Link>
      ))}
    </div>
  )
}
