import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-red-50 px-4">
        <div className="max-w-4xl text-center">
          <h1 className="mb-6 text-6xl font-bold text-gray-900">
            🎄 Christmas Planner
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            Your all-in-one solution for organizing the perfect Christmas celebration
          </p>
          <p className="mb-12 text-lg text-gray-500">
            Manage wishlists, plan events, set reminders, and share with family - all in one place
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 px-4">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Everything you need for Christmas planning
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-4xl">🎁</div>
                <h3 className="mb-2 text-xl font-bold">Smart Wishlists</h3>
                <p className="text-gray-600">
                  Create and share wishlists with product links, images, and prices.
                  Family can mark items as purchased to avoid duplicates.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-4xl">📅</div>
                <h3 className="mb-2 text-xl font-bold">Shared Calendar</h3>
                <p className="text-gray-600">
                  Plan events, set reminders, and create recurring tasks.
                  Share calendars with family to stay coordinated.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 text-4xl">🔔</div>
                <h3 className="mb-2 text-xl font-bold">Smart Reminders</h3>
                <p className="text-gray-600">
                  Never miss important dates with automatic email and in-app notifications
                  for your Christmas events.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 px-4">
        <div className="mx-auto max-w-6xl text-center text-gray-600">
          <p>Christmas Planner - Making your holidays stress-free since 2025</p>
        </div>
      </footer>
    </div>
  );
}
