import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

/** Last-resort screen for a render error. Shows no technical detail to the user. */
export default function RouteError() {
  const error = useRouteError()
  const notFound = isRouteErrorResponse(error) && error.status === 404
  return (
    <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface p-6 text-center text-ink">
      <h1 className="text-2xl font-extrabold">{notFound ? 'Page not found' : 'Something went wrong'}</h1>
      <p className="max-w-sm text-sm text-muted">{notFound ? 'That page does not exist.' : 'The page could not be shown. Please try again.'}</p>
      <Link to="/" className="rounded-full bg-brand px-6 py-3 font-bold text-white hover:bg-brand-dark">Go home</Link>
    </main>
  )
}
