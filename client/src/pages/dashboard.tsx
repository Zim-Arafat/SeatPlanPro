import { NavigationHeader } from '@/components/navigation-header';
import { ProgressSteps } from '@/components/progress-steps';
import { ConfigurationPanel } from '@/components/configuration-panel';
import { PreviewPanel } from '@/components/preview-panel';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create New Exam Seating Plan</h2>
          <p className="mt-2 text-gray-600">
            Configure exam details, room layouts, and generate automated seating arrangements
          </p>
        </div>

        {/* Progress Indicator */}
        <ProgressSteps />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <ConfigurationPanel />
          <PreviewPanel />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2025 Seat Plan Maker. Exam Management System v2.1.0
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <a href="#" className="hover:text-gray-700">Help</a>
              <a href="#" className="hover:text-gray-700">Support</a>
              <a href="#" className="hover:text-gray-700">Documentation</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
