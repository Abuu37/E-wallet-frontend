import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Services from './pages/Services'
import Fees from './pages/Fees'
import Faq from './pages/Faq'
import Contact from './pages/Contact'
import GetCard from './pages/GetCard'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'services', element: <Services /> },
      { path: 'fees', element: <Fees /> },
      { path: 'faq', element: <Faq /> },
      { path: 'contact', element: <Contact /> },
      { path: 'get-card', element: <GetCard /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
