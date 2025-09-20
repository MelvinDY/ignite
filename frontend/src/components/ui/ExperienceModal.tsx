import React from "react";
import { X } from "lucide-react";
import type { CreateExperienceRequest, Experience } from "../../lib/api/profile";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'volunteer', label: 'Volunteer' },
  { value: 'freelance', label: 'Freelance' },
];

const LOCATION_TYPES = [
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

type ExperienceModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  form: CreateExperienceRequest;
  isCurrent: boolean;
  setIsCurrent: (b: boolean) => void;
  handleChange: (key: keyof CreateExperienceRequest, value: string | number | null | boolean) => void;
  fieldErrors: Record<string, string[]>;
  formError: string | null;
  editingExperience?: Experience | null;
};

export function ExperienceModal({
  open,
  onClose,
  onSubmit,
  submitting,
  form,
  isCurrent,
  setIsCurrent,
  handleChange,
  fieldErrors,
  formError,
  editingExperience,
}: ExperienceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-black">
            {editingExperience ? 'Edit experience' : 'Add experience'}
          </h3>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700" aria-label="Close">
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="px-5 py-4 space-y-4">
          {formError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-black">Job Title <span className="text-red-600">*</span></label>
              <input
                type="text"
                required
                maxLength={120}
                value={form.roleTitle}
                onChange={(e) => handleChange("roleTitle", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
                placeholder="e.g. Software Engineer"
              />
              {fieldErrors.roleTitle && <p className="mt-1 text-xs text-red-600">{fieldErrors.roleTitle[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Company <span className="text-red-600">*</span></label>
              <input
                type="text"
                required
                maxLength={120}
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
                placeholder="e.g. Google"
              />
              {fieldErrors.company && <p className="mt-1 text-xs text-red-600">{fieldErrors.company[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-black">Field of Work</label>
              <input
                type="text"
                maxLength={120}
                value={form.fieldOfWork || ""}
                onChange={(e) => handleChange("fieldOfWork", e.target.value || null)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
                placeholder="e.g. Technology, Finance, Healthcare"
              />
              {fieldErrors.fieldOfWork && <p className="mt-1 text-xs text-red-600">{fieldErrors.fieldOfWork[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Employment Type</label>
              <select
                value={form.employmentType || ""}
                onChange={(e) => handleChange("employmentType", e.target.value || null)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black"
              >
                <option value="">Select employment type</option>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {fieldErrors.employmentType && <p className="mt-1 text-xs text-red-600">{fieldErrors.employmentType[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-black">Location City</label>
              <input
                type="text"
                value={form.locationCity || ""}
                onChange={(e) => handleChange("locationCity", e.target.value || null)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
                placeholder="e.g. Sydney"
              />
              {fieldErrors.locationCity && <p className="mt-1 text-xs text-red-600">{fieldErrors.locationCity[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Country Code</label>
              <input
                type="text"
                maxLength={2}
                value={form.locationCountry || ""}
                onChange={(e) => handleChange("locationCountry", e.target.value.toUpperCase() || null)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
                placeholder="AU"
              />
              {fieldErrors.locationCountry && <p className="mt-1 text-xs text-red-600">{fieldErrors.locationCountry[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Location Type</label>
              <select
                value={form.locationType || ""}
                onChange={(e) => handleChange("locationType", e.target.value || null)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black"
              >
                <option value="">Select location type</option>
                {LOCATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {fieldErrors.locationType && <p className="mt-1 text-xs text-red-600">{fieldErrors.locationType[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-black">Start Month <span className="text-red-600">*</span></label>
              <select
                value={form.startMonth}
                onChange={(e) => handleChange("startMonth", Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{MONTHS[m]}</option>
                ))}
              </select>
              {fieldErrors.startMonth && <p className="mt-1 text-xs text-red-600">{fieldErrors.startMonth[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Start Year <span className="text-red-600">*</span></label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={form.startYear}
                onChange={(e) => handleChange("startYear", Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black"
              />
              {fieldErrors.startYear && <p className="mt-1 text-xs text-red-600">{fieldErrors.startYear[0]}</p>}
            </div>

            <div>
              <label className="block font-medium text-black">End Month</label>
              <select
                value={form.endMonth ?? ""}
                onChange={(e) => handleChange("endMonth", e.target.value === "" ? null : Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black disabled:bg-gray-100"
                disabled={isCurrent}
              >
                <option value="">Select month</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{MONTHS[m]}</option>
                ))}
              </select>
              {fieldErrors.endMonth && <p className="mt-1 text-xs text-red-600">{fieldErrors.endMonth[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">End Year</label>
              <input
                type="number"
                min="1900"
                max="2100"
                value={form.endYear ?? ""}
                onChange={(e) => handleChange("endYear", e.target.value === "" ? null : Number(e.target.value))}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black disabled:bg-gray-100"
                disabled={isCurrent}
              />
              {fieldErrors.endYear && <p className="mt-1 text-xs text-red-600">{fieldErrors.endYear[0]}</p>}
            </div>
          </div>

          <label className="flex-inline-center gap-2 text-black">
            <input
              type="checkbox"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-black focus:ring-[#ffbe32]"
            />
            I currently work here
          </label>

          <div>
            <label className="block font-medium text-black">Description</label>
            <textarea
              rows={4}
              maxLength={2000}
              value={form.description || ""}
              onChange={(e) => handleChange("description", e.target.value || null)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
              placeholder="Describe your role and responsibilities..."
            />
            {fieldErrors.description && <p className="mt-1 text-xs text-red-600">{fieldErrors.description[0]}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#3E000C] px-4 py-2 font-medium text-white hover:bg-[#3E000C]/90 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}