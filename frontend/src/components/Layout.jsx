import Navbar from './Navbar'
import Footer from './Footer'
import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  )
}
