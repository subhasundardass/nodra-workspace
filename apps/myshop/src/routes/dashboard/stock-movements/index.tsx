import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/stock-movements/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/stock-movements/"!</div>
}
