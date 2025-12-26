import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: HomeComponent,
});

function HomeComponent() {
  return (
    <div>
      <Link to="/sign-in" className="block">
        Sign in
      </Link>
      <Link to="/sign-up" className="block">
        Sign up
      </Link>
    </div>
  );
}
