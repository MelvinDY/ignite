import React from "react";

interface ProfileExperienceProps {
  experience: any[];
}

export function ProfileExperience({ experience }: ProfileExperienceProps) {
  if (!experience || experience.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Experience</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No experience added yet</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  const formatDateRange = (
    startDate: string,
    endDate: string | null,
    isCurrent: boolean
  ) => {
    const start = formatDate(startDate);
    if (isCurrent) {
      return `${start} - Present`;
    }
    if (endDate) {
      return `${start} - ${formatDate(endDate)}`;
    }
    return start;
  };

  const calculateDuration = (
    startDate: string,
    endDate: string | null,
    isCurrent: boolean
  ) => {
    const start = new Date(startDate);
    const end = isCurrent
      ? new Date()
      : endDate
      ? new Date(endDate)
      : new Date();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // Average month length

    if (diffMonths < 12) {
      return `${diffMonths} month${diffMonths !== 1 ? "s" : ""}`;
    }

    const years = Math.floor(diffMonths / 12);
    const remainingMonths = diffMonths % 12;

    if (remainingMonths === 0) {
      return `${years} year${years !== 1 ? "s" : ""}`;
    }

    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${
      remainingMonths !== 1 ? "s" : ""
    }`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
        <svg
          className="w-6 h-6 mr-2 text-[var(--dark-red)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 002 2h2a2 2 0 002-2V8a2 2 0 00-2-2h-2z"
          />
        </svg>
        Experience
      </h2>

      <div className="space-y-6">
        {experience.map((exp, index) => (
          <div key={exp.id} className="relative">
            {/* Timeline connector */}
            {index < experience.length - 1 && (
              <div className="absolute left-4 top-12 w-0.5 h-16 bg-gray-200"></div>
            )}

            <div className="flex items-start space-x-4">
              {/* Timeline dot */}
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  exp.is_current
                    ? "border-[var(--dark-red)] bg-[var(--dark-red)]"
                    : "border-gray-300 bg-white"
                }`}
              >
                {exp.is_current && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </div>

              {/* Experience content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {exp.title}
                    </h3>
                    <p className="text-[var(--dark-red)] font-medium">
                      {exp.company}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0 sm:text-right">
                    <p className="text-sm text-gray-600 font-medium">
                      {formatDateRange(
                        exp.start_date,
                        exp.end_date,
                        exp.is_current
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {calculateDuration(
                        exp.start_date,
                        exp.end_date,
                        exp.is_current
                      )}
                    </p>
                  </div>
                </div>

                {exp.description && (
                  <div className="mt-3">
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {exp.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
