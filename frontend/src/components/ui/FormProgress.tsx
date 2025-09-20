import React from "react";

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function FormProgress({ currentStep, totalSteps }: FormProgressProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => {
          const stepNumber = i + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={stepNumber}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  isActive
                    ? "bg-white text-[var(--dark-red)]"
                    : isCompleted
                    ? "bg-white/80 text-[var(--dark-red)]"
                    : "bg-white/20 text-white border border-white/30"
                }`}
              >
                {stepNumber}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={`w-8 h-px ${
                    isCompleted ? "bg-white/80" : "bg-white/30"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-center text-white/80 text-sm mt-2">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  );
}
