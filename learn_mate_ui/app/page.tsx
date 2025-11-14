import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Award, Wifi } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <BookOpen className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">LearnMate South Sudan</h1>
        </div>
        <div className="flex gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Learn Anytime, Anywhere
        </h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Access quality education even without internet. Download subjects and learn offline at your own pace.
        </p>
        <Link href="/auth/register">
          <Button size="lg" className="text-lg px-8 py-6">
            Start Learning Free
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Why Choose LearnMate?
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Wifi className="h-8 w-8 text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold mb-3">Offline First</h4>
            <p className="text-gray-600">
              Download subjects and access all lessons, quizzes, and materials without internet connection.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
            <h4 className="text-xl font-semibold mb-3">Comprehensive Content</h4>
            <p className="text-gray-600">
              Access full curriculum with lessons, interactive quizzes, and detailed progress tracking.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-lg">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="text-xl font-semibold mb-3">Track Progress</h4>
            <p className="text-gray-600">
              Monitor your learning journey with detailed analytics and achievement tracking.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-blue-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Start Learning?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of students already learning with LearnMate
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 border-t">
        <p>&copy; 2024 LearnMate South Sudan. All rights reserved.</p>
      </footer>
    </div>
  );
}
