import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/user/$name')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/user/$name"!</div>
}
