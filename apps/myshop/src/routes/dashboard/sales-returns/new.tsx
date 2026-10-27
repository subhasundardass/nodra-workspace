import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/sales-returns/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/sales-returns/new"!</div>
}
