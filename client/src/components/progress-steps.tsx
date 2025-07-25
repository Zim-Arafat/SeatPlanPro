import { useExamStore } from '@/store/exam-store';

export function ProgressSteps() {
  const { currentStep } = useExamStore();

  const steps = [
    { number: 1, title: 'Exam Details' },
    { number: 2, title: 'Room Setup' },
    { number: 3, title: 'Generate' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.number
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step.number}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  currentStep >= step.number ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-16 h-1 bg-gray-200 mx-4"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
