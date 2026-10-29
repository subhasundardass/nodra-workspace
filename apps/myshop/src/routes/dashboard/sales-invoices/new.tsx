import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/sales-invoices/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/sales-invoices/new"!</div>
}
