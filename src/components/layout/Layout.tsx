import { useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'
import AnimatedOutlet from './AnimatedOutlet'

const noFooterPaths = ['/login', '/register']

export default function Layout() {
  const { pathname } = useLocation()
  const hideFooter = noFooterPaths.includes(pathname)

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <AnimatedOutlet />
      </main>
      {!hideFooter && <Footer />}
    </div>
  )
}
