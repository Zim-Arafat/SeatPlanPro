import { Link, useLocation } from 'wouter';

export function NavigationHeader() {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-primary">Seat Plan Maker</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/"
                className={`font-medium pb-1 ${
                  location === '/'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/history"
                className={`font-medium pb-1 ${
                  location === '/history'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Exam History
              </Link>
              <Link
                href="/rooms"
                className={`font-medium pb-1 ${
                  location === '/rooms'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Room Management
              </Link>
              <Link
                href="/reports"
                className={`font-medium pb-1 ${
                  location === '/reports'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Welcome, <span className="font-medium">Admin User</span>
            </span>
            <button className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
