import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/organizer/dashboard')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/organizer/dashboard"!</div>
}
