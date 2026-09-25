import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import FoodCard from '../components/FoodCard'
import { formatNaira } from '../lib/format'
import { catalogApi } from '../lib/endpoints'
import { ApiError } from '../lib/api'
import { useCart } from '../context/CartContext'

export default function FoodDetail() {
  const { slug } = useParams()
  const { addToCart } = useCart()

  const [food, setFood] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [related, setRelated] = useState([])
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setFood(null)
    setNotFound(false)
    setQty(1)
    catalogApi
      .getFood(slug)
      .then((f) => {
        setFood(f)
        catalogApi
          .listFoods({ category: f.category_slug })
          .then((list) => setRelated(list.filter((r) => r.id !== f.id).slice(0, 4)))
          .catch(() => setRelated([]))
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) setNotFound(true)
      })
  }, [slug])

  if (notFound) {
    return <Navigate to="/menu" replace />
  }

  if (!food) {
    return (
      <Layout>
        <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12 animate-pulse">
            <div className="rounded-xl2 bg-border aspect-square" />
            <div className="space-y-4">
              <div className="h-8 bg-border rounded w-2/3" />
              <div className="h-4 bg-border rounded w-full" />
              <div className="h-4 bg-border rounded w-5/6" />
              <div className="h-10 bg-border rounded w-1/3 mt-6" />
            </div>
          </div>
        </section>
      </Layout>
    )
  }

  const soldOut = food.is_sold_out

  const handleAdd = () => {
    addToCart(food, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <Layout>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-16">
        <Link to="/menu" className="text-sm text-muted hover:text-ink inline-flex items-center gap-1 mb-6">
          ← Back to menu
        </Link>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div className="rounded-xl2 overflow-hidden bg-border aspect-square relative">
            <img
              src={food.image_url}
              alt={food.name}
              className={`w-full h-full object-cover ${soldOut ? 'grayscale opacity-70' : ''}`}
            />
            {soldOut && (
              <span className="absolute inset-0 bg-ink/40 grid place-items-center">
                <span className="bg-white text-ink text-sm font-semibold px-4 py-2 rounded-full">Sold Out Today</span>
              </span>
            )}
          </div>

          <div>
            <h1 className="font-display text-3xl font-medium">{food.name}</h1>
            <p className="text-muted mt-3 leading-relaxed">{food.description}</p>

            <div className="flex items-center gap-4 mt-5">
              <span className="font-display text-2xl font-semibold text-primary">{formatNaira(food.price)}</span>
              <span className="text-sm text-muted">·</span>
              <span className="text-sm text-muted">{food.prep_time_minutes} min prep</span>
            </div>

            <div className="mt-2">
              {soldOut ? (
                <span className="text-sm font-medium text-danger">Currently sold out</span>
              ) : food.is_low_stock ? (
                <span className="text-sm font-medium text-warn">Only {food.quantity_available} left today</span>
              ) : (
                <span className="text-sm font-medium text-success">In stock</span>
              )}
            </div>

            {!soldOut && (
              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center border border-border rounded-full">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-10 h-10 grid place-items-center text-lg"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-medium">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(food.quantity_available, q + 1))}
                    className="w-10 h-10 grid place-items-center text-lg"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <Button onClick={handleAdd} className="flex-1 sm:flex-none">
                  {added ? 'Added ✓' : `Add to cart — ${formatNaira(food.price * qty)}`}
                </Button>
              </div>
            )}

            <div className="mt-8 border-t border-border pt-6">
              <h3 className="text-sm font-semibold mb-2">Delivery notes</h3>
              <p className="text-sm text-muted leading-relaxed">
                You can add notes like &ldquo;no pepper&rdquo; or &ldquo;extra spoon&rdquo; at checkout, and chat with us
                about your order once it&apos;s placed.
              </p>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-medium mb-5">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
              {related.map((f) => (
                <FoodCard key={f.id} food={f} />
              ))}
            </div>
          </div>
        )}
      </section>
    </Layout>
  )
}
