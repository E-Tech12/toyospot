// What's left here is content this API deliberately doesn't own yet:
// curated homepage reviews (no review-submission flow was in scope) and the
// small display-label maps for order/payment status, which are pure UI
// concerns that mirror the enum values the backend returns.

export const REVIEWS = [
  { id: 'r1', name: 'Amaka O.', rating: 5, text: "The jollof tastes homemade, not restaurant-homemade — actually homemade. Delivery was quick too.", meal: 'Jollof Rice' },
  { id: 'r2', name: 'Tunde A.', rating: 5, text: 'Ordered the ofada for a Sunday craving and it did not disappoint. Will reorder.', meal: 'Ofada Rice & Ayamase' },
  { id: 'r3', name: 'Ifeoma K.', rating: 4, text: "Efo riro was rich and well seasoned. Wish the portion was slightly bigger but I'll order again.", meal: 'Efo Riro' },
  { id: 'r4', name: 'David E.', rating: 5, text: "Being able to chat directly about my order (less pepper, extra spoon) and have it actually followed is what keeps me coming back.", meal: 'Egusi Soup' }
]

export const ORDER_STATUS_FLOW = ['pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered']

export const ORDER_STATUS_LABEL = {
  pending: 'Pending',
  accepted: 'Accepted',
  preparing: 'Preparing',
  ready: 'Ready',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export const PAYMENT_STATUS_LABEL = {
  unpaid: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
}
