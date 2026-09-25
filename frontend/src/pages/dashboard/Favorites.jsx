import { Link } from 'react-router-dom'
import { useFavorites } from '../../context/FavoritesContext'
import FoodCard from '../../components/FoodCard'

export default function Favorites() {
  const { favorites, isLoading } = useFavorites()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl2 border border-border overflow-hidden">
            <div className="aspect-[4/3] bg-border animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-border rounded animate-pulse w-3/4" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-display text-xl">No favorites yet</p>
        <p className="text-sm text-muted mt-2">Tap the heart on any meal to save it here for quick reordering.</p>
        <Link to="/menu" className="inline-block mt-6 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-full">
          Browse the menu
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
      {favorites.map((f) => (
        <FoodCard key={f.id} food={f} />
      ))}
    </div>
  )
}
