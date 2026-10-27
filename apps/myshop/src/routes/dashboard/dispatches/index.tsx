import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/dispatches/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/dispatches/"!</div>
}
