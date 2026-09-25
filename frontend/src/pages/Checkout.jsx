import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import Button from '../components/Button'
import FormField from '../components/FormField'
import { formatNaira } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { orderApi, addressApi, paymentApi } from '../lib/endpoints'
import { ApiError } from '../lib/api'
import { openPaystackPopup } from '../lib/paystack'

export default function Checkout() {
  const { items, itemTotal, deliveryFee, grandTotal, clearCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    fullName: user ? `${user.first_name} ${user.last_name}` : '',
    phone: user?.phone || '',
    address: '',
    notes: ''
  })
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    addressApi
      .list()
      .then((addresses) => {
        const def = addresses.find((a) => a.is_default) || addresses[0]
        if (def) {
          setForm((f) => ({
            ...f,
            address: f.address || `${def.line1}${def.city ? ', ' + def.city : ''}`,
            phone: f.phone || def.phone
          }))
        }
      })
      .catch(() => {})
  }, [])

  if (items.length === 0) return <Navigate to="/menu" replace />

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.fullName || !form.phone || !form.address) {
      setError('Fill in your name, phone number and delivery address.')
      return
    }
    setPlacing(true)
    try {
      const order = await orderApi.checkout({
        items: items.map((i) => ({ food_id: i.id, quantity: i.qty })),
        full_name: form.fullName,
        phone: form.phone,
        address_line: form.address,
        notes: form.notes,
        payment_method: paymentMethod
      })

      // The order exists and stock is already decremented at this point
      // regardless of payment outcome, so the cart is done being needed.
      clearCart()

      if (paymentMethod === 'online') {
        await launchPayment(order)
      } else {
        navigate('/dashboard/orders', { state: { justPlaced: true } })
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(err.message + ' Please update your cart and try again.')
      } else if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Something went wrong placing your order. Please try again.')
      }
    } finally {
      setPlacing(false)
    }
  }

  const launchPayment = async (order) => {
    try {
      const init = await paymentApi.initialize(order.id)
      openPaystackPopup({
        publicKey: init.public_key,
        email: user.email,
        amountNaira: init.amount,
        reference: init.reference,
        onSuccess: async (reference) => {
          try {
            await paymentApi.verify(order.id, reference)
          } catch {
            // Verification failing client-side isn't fatal -- Paystack's
            // webhook (see backend README) confirms it independently, so
            // the order still ends up marked paid even if this call fails.
          }
          navigate('/dashboard/orders', { state: { justPlaced: true } })
        },
        onCancel: () => {
          // Order already exists as unpaid; let them retry from its detail page.
          navigate(`/dashboard/orders/${order.id}`, { state: { paymentCancelled: true } })
        }
      })
    } catch (err) {
      // Payment couldn't even start -- still land them on the order so
      // they can retry rather than losing track of an order that exists.
      navigate(`/dashboard/orders/${order.id}`, { state: { paymentFailedToStart: true } })
    }
  }

  return (
    <Layout>
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="font-display text-3xl font-medium mb-8">Checkout</h1>

        <form onSubmit={handlePlaceOrder} className="grid lg:grid-cols-[1fr,340px] gap-10">
          <div className="space-y-8">
            <div>
              <h2 className="font-semibold mb-4">Delivery details</h2>
              <div className="space-y-4">
                <FormField
                  label="Full name"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Your full name"
                />
                <FormField
                  label="Phone number"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+234 800 000 0000"
                />
                <FormField
                  label="Delivery address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, area, city"
                />
                <label className="block">
                  <span className="block text-sm font-medium text-ink mb-1.5">Delivery notes (optional)</span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="e.g. No pepper, extra spoon, call when arriving"
                    rows={3}
                    className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm bg-surface placeholder:text-muted/70 focus:border-primary transition-colors resize-none"
                  />
                </label>
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-4">Payment method</h2>
              <div className="space-y-3">
                <PaymentOption
                  id="online"
                  label="Pay online"
                  description="Card or bank transfer, processed securely."
                  selected={paymentMethod === 'online'}
                  onSelect={setPaymentMethod}
                />
                <PaymentOption
                  id="on_delivery"
                  label="Pay on delivery"
                  description="Pay cash or transfer when your order arrives."
                  selected={paymentMethod === 'on_delivery'}
                  onSelect={setPaymentMethod}
                />
              </div>
            </div>
          </div>

          <div className="bg-surface border border-border rounded-xl2 p-6 h-fit">
            <h2 className="font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {items.map((i) => (
                <div key={i.id} className="flex justify-between text-sm">
                  <span className="text-muted">
                    {i.qty}× {i.name}
                  </span>
                  <span className="font-medium">{formatNaira(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Item total</span>
                <span className="text-ink font-medium">{formatNaira(itemTotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery fee</span>
                <span className="text-ink font-medium">{formatNaira(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t border-border">
                <span>Grand total</span>
                <span className="text-primary">{formatNaira(grandTotal)}</span>
              </div>
            </div>
            {error && <p className="text-sm text-danger mt-4">{error}</p>}
            <Button type="submit" loading={placing} className="w-full mt-5">
              Place order
            </Button>
            <p className="text-xs text-muted mt-3 leading-relaxed">
              Prices and stock are confirmed by the kitchen at checkout, so the total here may be adjusted if something
              sold out in the last few minutes.
            </p>
          </div>
        </form>
      </section>
    </Layout>
  )
}

function PaymentOption({ id, label, description, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-colors ${
        selected ? 'border-primary bg-primary-light/40' : 'border-border'
      }`}
    >
      <span
        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 grid place-items-center ${
          selected ? 'border-primary' : 'border-border'
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted mt-0.5">{description}</span>
      </span>
    </button>
  )
}
