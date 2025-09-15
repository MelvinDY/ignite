import React from "react";
import { X } from "lucide-react";
import type { AddEducationRequest } from "../../lib/api/profile";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type EducationModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  form: AddEducationRequest;
  isCurrent: boolean;
  setIsCurrent: (b: boolean) => void;
  handleChange: (key: keyof AddEducationRequest, value: string | number | null) => void;
  fieldErrors: Record<string, string[]>;
  formError: string | null;
};

export function EducationModal({
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
}: EducationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div
        role="dialog"
        aria-modal="true"
        className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl"
      >
        <div className="flex-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-black">Add education</h3>
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

          <div>
            <label className="block font-medium text-black">School</label>
            <input
              type="text"
              required
              maxLength={30}
              value={form.school}
              onChange={(e) => handleChange("school", e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
            />
            {fieldErrors.school && <p className="mt-1 text-xs text-red-600">{fieldErrors.school[0]}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-black">Program</label>
              <input
                type="text"
                value={form.program ?? ""} // null-safe display
                onChange={(e) =>
                  handleChange("program", e.target.value.trim() === "" ? null : e.target.value)
                } // convert "" -> null
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
              />
              {fieldErrors.program && <p className="mt-1 text-xs text-red-600">{fieldErrors.program[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Major</label>
              <input
                type="text"
                value={form.major ?? ""} // null-safe display
                onChange={(e) => handleChange("major", e.target.value.trim() === "" ? null : e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
              />
              {fieldErrors.major && <p className="mt-1 text-xs text-red-600">{fieldErrors.major[0]}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block font-medium text-black">Start Month</label>
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
              <label className="block font-medium text-black">Start Year</label>
              <input
                type="number"
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
            I'm currently studying here
          </label>

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
