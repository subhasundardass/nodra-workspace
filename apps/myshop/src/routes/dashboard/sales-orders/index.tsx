import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/sales-orders/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/sales-orders/"!</div>
}
