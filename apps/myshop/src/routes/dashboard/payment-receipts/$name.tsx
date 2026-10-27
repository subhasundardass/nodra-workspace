import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/payment-receipts/$name')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/payment-receipts/$name"!</div>
}
