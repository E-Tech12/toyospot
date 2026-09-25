import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'toyospot_cart'
const DEFAULT_DELIVERY_FEE = 1000 // mirrors the backend's settings.DELIVERY_FEE; the server total is authoritative at checkout

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  // `food` is a FoodOut object from the API: { id, slug, name, price,
  // image_url, quantity_available, is_sold_out, ... }
  const addToCart = (food, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === food.id)
      const maxQty = food.quantity_available
      if (existing) {
        const nextQty = Math.min(existing.qty + qty, maxQty)
        return prev.map((i) => (i.id === food.id ? { ...i, qty: nextQty } : i))
      }
      return [
        ...prev,
        { id: food.id, slug: food.slug, name: food.name, price: food.price, image: food.image_url, qty: Math.min(qty, maxQty) }
      ]
    })
  }

  const removeFromCart = (foodId) => {
    setItems((prev) => prev.filter((i) => i.id !== foodId))
  }

  // `maxAvailable` is optional and comes from a fresh FoodOut lookup when the
  // caller has one handy (e.g. the cart page revalidating stock); otherwise
  // we just trust the last-known quantity and let checkout be the final say.
  const updateQty = (foodId, qty, maxAvailable) => {
    if (qty <= 0) {
      removeFromCart(foodId)
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.id === foodId ? { ...i, qty: maxAvailable ? Math.min(qty, maxAvailable) : qty } : i))
    )
  }

  const clearCart = () => setItems([])

  const itemTotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])
  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const deliveryFee = items.length ? DEFAULT_DELIVERY_FEE : 0
  const grandTotal = itemTotal + deliveryFee

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQty, clearCart, itemTotal, itemCount, deliveryFee, grandTotal }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
