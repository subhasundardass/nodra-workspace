import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/dispatches/$name')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/dispatches/$name"!</div>
}
