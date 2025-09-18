import React from "react";

export function ProfileSkills() {
  // Hardcoded skills for now
  const hardcodedSkills = [
    { id: "1", name: "React", category: "Framework" },
    { id: "2", name: "TypeScript", category: "Programming" },
    { id: "3", name: "Node.js", category: "Technical" },
    { id: "4", name: "Python", category: "Programming" },
    { id: "5", name: "PostgreSQL", category: "Database" },
    { id: "6", name: "Leadership", category: "Soft Skill" },
    { id: "7", name: "Project Management", category: "Soft Skill" },
    { id: "8", name: "Git", category: "Tool" },
  ];

  const getTagColor = (category: string) => {
    const colors = {
      Technical: "bg-blue-100 text-blue-800 border-blue-200",
      Programming: "bg-green-100 text-green-800 border-green-200",
      Framework: "bg-purple-100 text-purple-800 border-purple-200",
      Database: "bg-orange-100 text-orange-800 border-orange-200",
      Tool: "bg-yellow-100 text-yellow-800 border-yellow-200",
      "Soft Skill": "bg-indigo-100 text-indigo-800 border-indigo-200",
      Other: "bg-gray-100 text-gray-800 border-gray-200",
    };

    return colors[category as keyof typeof colors] || colors.Other;
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        Skills
      </h2>

      <div className="flex flex-wrap gap-2">
        {hardcodedSkills.map((skill) => (
          <span
            key={skill.id}
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getTagColor(
              skill.category
            )}`}
          >
            {skill.name}
          </span>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500 text-center">
          {hardcodedSkills.length} skills total
        </p>
      </div>
    </div>
  );
}
