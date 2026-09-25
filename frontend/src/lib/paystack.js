// Thin wrapper around Paystack's Inline v2 script (loaded via <script> tag
// in index.html as window.PaystackPop) so the rest of the app doesn't need
// to know Paystack's specific API shape.

export function isPaystackLoaded() {
  return typeof window !== 'undefined' && typeof window.PaystackPop !== 'undefined'
}

/**
 * @param {object} opts
 * @param {string} opts.publicKey
 * @param {string} opts.email
 * @param {number} opts.amountNaira
 * @param {string} opts.reference
 * @param {(reference: string) => void} opts.onSuccess
 * @param {() => void} [opts.onCancel]
 */
export function openPaystackPopup({ publicKey, email, amountNaira, reference, onSuccess, onCancel }) {
  if (!isPaystackLoaded()) {
    throw new Error('Payment could not load. Please check your connection and try again.')
  }

  const popup = new window.PaystackPop()
  popup.newTransaction({
    key: publicKey,
    email,
    amount: Math.round(amountNaira * 100), // Paystack expects kobo
    currency: 'NGN',
    ref: reference,
    onSuccess: (transaction) => onSuccess(transaction.reference || reference),
    onCancel: () => onCancel?.()
  })
}
