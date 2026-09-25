import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { customerApi } from '../lib/endpoints'
import { formatNaira } from '../lib/format'

export default function Customers() {
  const [customers, setCustomers] = useState(null)

  useEffect(() => {
    customerApi.list().then(setCustomers).catch(() => setCustomers([]))
  }, [])

  return (
    <Layout title="Customers">
      <div className="bg-surface border border-border rounded-xl2 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Orders</th>
              <th className="px-5 py-3 font-medium">Total spent</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers === null ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-muted">No customers yet.</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium">{c.first_name} {c.last_name}</td>
                  <td className="px-5 py-3 text-muted">
                    <div>{c.email}</div>
                    {c.phone && <div className="text-xs">{c.phone}</div>}
                  </td>
                  <td className="px-5 py-3">{c.order_count}</td>
                  <td className="px-5 py-3 font-medium">{formatNaira(c.total_spent)}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/orders?customer=${c.id}`} className="text-primary text-xs font-medium">
                      View orders
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>
    </Layout>
  )
}
