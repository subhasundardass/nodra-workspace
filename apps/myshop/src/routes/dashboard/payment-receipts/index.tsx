import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/payment-receipts/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/payment-receipts/"!</div>
}
