import Navbar from './Navbar'
import Footer from './Footer'
import AnimatedOutlet from './AnimatedOutlet'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  )
}
