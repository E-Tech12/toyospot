import { Link } from 'react-router-dom'
import Layout from '../components/Layout'

export default function NotFound() {
  return (
    <Layout>
      <section className="max-w-md mx-auto px-4 py-28 text-center">
        <p className="font-display text-6xl text-primary/40 font-medium">404</p>
        <h1 className="font-display text-2xl font-medium mt-3">Page not found</h1>
        <p className="text-sm text-muted mt-2">The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block mt-6 bg-primary text-white text-sm font-semibold px-6 py-3 rounded-full">
          Back to home
        </Link>
      </section>
    </Layout>
  )
}
