export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          GON
        </h1>
        <p className="text-lg text-gray-600">
          Your AI Marketing Team
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <a
            href="/login"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Sign In
          </a>
          <a
            href="/register"
            className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
