import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/billing/sales-invoice/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/billing/sales-invoice/new"!</div>
}
