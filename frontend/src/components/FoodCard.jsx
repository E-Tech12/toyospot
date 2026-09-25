import { Link } from 'react-router-dom'
import { formatNaira } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'

// `food` is a FoodOut object from the API.
export default function FoodCard({ food }) {
  const { addToCart } = useCart()
  const { isAuthenticated } = useAuth()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const soldOut = food.is_sold_out
  const isFavorite = favoriteIds.has(food.id)

  return (
    <div className="group bg-surface rounded-xl2 overflow-hidden border border-border hover:shadow-warm transition-shadow">
      <Link to={`/food/${food.slug}`} className="block relative aspect-[4/3] overflow-hidden bg-border">
        <img
          src={food.image_url}
          alt={food.name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${soldOut ? 'grayscale opacity-70' : ''}`}
          loading="lazy"
        />
        {food.is_popular && !soldOut && (
          <span className="absolute top-2 left-2 bg-gold text-white text-[11px] font-semibold px-2 py-1 rounded-full">
            Popular
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 bg-ink/40 grid place-items-center">
            <span className="bg-white text-ink text-xs font-semibold px-3 py-1.5 rounded-full">Sold Out</span>
          </span>
        )}
        {!soldOut && food.is_low_stock && (
          <span className="absolute bottom-2 left-2 bg-white/95 text-warn text-[11px] font-semibold px-2 py-1 rounded-full">
            Only {food.quantity_available} left
          </span>
        )}
        {isAuthenticated && (
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleFavorite(food)
            }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 grid place-items-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isFavorite ? '#E1481F' : 'none'} stroke="#E1481F" strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
            </svg>
          </button>
        )}
      </Link>

      <div className="p-4">
        <Link to={`/food/${food.slug}`}>
          <h3 className="font-semibold text-[15px] leading-snug hover:text-primary transition-colors">{food.name}</h3>
        </Link>
        <p className="text-xs text-muted mt-1 line-clamp-2">{food.description}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="font-display font-semibold text-primary">{formatNaira(food.price)}</span>
          <button
            onClick={() => addToCart(food, 1)}
            disabled={soldOut}
            className="text-xs font-semibold px-3 py-2 rounded-full bg-primary text-white disabled:bg-border disabled:text-muted disabled:cursor-not-allowed hover:bg-primary-dark transition-colors"
          >
            {soldOut ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}
