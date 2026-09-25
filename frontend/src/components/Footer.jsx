import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface pb-24 md:pb-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-full bg-primary text-white grid place-items-center font-display font-semibold text-sm">T</span>
            <span className="font-display text-lg font-semibold">Toyo&apos;s Pot</span>
          </div>
          <p className="text-sm text-muted max-w-xs leading-relaxed">
            Homemade Nigerian meals, cooked fresh daily and delivered to your door. One kitchen, one standard.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Explore</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link to="/menu" className="hover:text-ink">Menu</Link></li>
            <li><Link to="/about" className="hover:text-ink">About</Link></li>
            <li><Link to="/contact" className="hover:text-ink">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Get in touch</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>+234 803 555 0192</li>
            <li>hello@toyospot.ng</li>
            <li>Lagos, Nigeria · 9am – 9pm daily</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted">
        © {new Date().getFullYear()} Toyo&apos;s Pot. All rights reserved.
      </div>
    </footer>
  )
}
