import { Link, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import { formatNaira } from '../lib/format'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, updateQty, removeFromCart, itemTotal, deliveryFee, grandTotal } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <Layout>
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-light mx-auto grid place-items-center mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#E1481F" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.5 3h2l2.4 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 8H6" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-medium">Your cart is empty</h1>
          <p className="text-muted text-sm mt-2">Add something from today&apos;s menu to get started.</p>
          <Link to="/menu" className="inline-block mt-6 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-full">
            Browse the menu
          </Link>
        </section>
      </Layout>
    )
  }

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl font-medium mb-8">Your Cart</h1>

        <div className="grid lg:grid-cols-[1fr,340px] gap-10">
          <div className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <div key={item.id} className="py-5 flex items-center gap-4">
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{item.name}</p>
                  <p className="text-sm text-muted mt-0.5">{formatNaira(item.price)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-xs text-danger font-medium mt-1.5"
                  >
                    Remove
                  </button>
                </div>
                <div className="flex items-center border border-border rounded-full shrink-0">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-8 h-8 grid place-items-center"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-8 h-8 grid place-items-center"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>
                <p className="w-20 text-right font-semibold text-sm shrink-0">{formatNaira(item.price * item.qty)}</p>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-xl2 p-6 h-fit sticky top-24">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-muted">
                <span>Item total</span>
                <span className="text-ink font-medium">{formatNaira(itemTotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery fee</span>
                <span className="text-ink font-medium">{formatNaira(deliveryFee)}</span>
              </div>
            </div>
            <div className="border-t border-border mt-4 pt-4 flex justify-between font-semibold">
              <span>Grand total</span>
              <span className="text-primary">{formatNaira(grandTotal)}</span>
            </div>
            <Button onClick={() => navigate('/checkout')} className="w-full mt-5">
              Proceed to checkout
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}
