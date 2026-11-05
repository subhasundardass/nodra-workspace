import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/dispatch/$name')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/dispatches/$name"!</div>
}
