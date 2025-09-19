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
  mode?: "create" | "edit";
  onDelete?: () => void;
  deleting?: boolean;
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
  mode = "create",
  onDelete,
  deleting
}: EducationModalProps) {
  if (!open) return null;

  // CHANGED: local state to toggle the danger confirmation panel
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

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
          <h3 className="text-lg font-semibold text-black">
            {mode === "create" ? "Add education" : "Edit education"}
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

          {mode === "edit" && confirmingDelete && (
            <div
              className="rounded-md border border-red-300 bg-red-50 p-4"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {/* simple alert icon */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-600" fill="none" stroke="currentColor">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-red-800">Delete this education?</h4>
                  <p className="text-sm text-red-700 mt-1">
                    This action can't be undone. The education entry will be permanently removed from your profile.
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onDelete}
                      className="rounded-md bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:opacity-60"
                      disabled={submitting || deleting}
                    >
                      {deleting ? "Deleting..." : "Yes, delete"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(false)}
                      className="rounded-md border border-gray-300 px-3 py-2 text-black bg-white hover:bg-gray-50 disabled:opacity-60"
                      disabled={submitting || deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block font-medium text-black">School <span className="text-red-600">*</span></label>
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
              <label className="block font-medium text-black">Program <span className="text-red-600">*</span></label>
              <input
                type="text"
                required
                value={form.program}
                onChange={(e) => handleChange("program", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
              />
              {fieldErrors.program && <p className="mt-1 text-xs text-red-600">{fieldErrors.program[0]}</p>}
            </div>
            <div>
              <label className="block font-medium text-black">Major <span className="text-red-600">*</span></label>
              <input
                type="text"
                required
                value={form.major}
                onChange={(e) => handleChange("major", e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#ffbe32]"
              />
              {fieldErrors.major && <p className="mt-1 text-xs text-red-600">{fieldErrors.major[0]}</p>}
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
                <option value="">--</option>
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

          <div className="flex-between gap-3 pt-2">
            {mode === "edit" ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete((v) => !v)}
                className={`rounded-md px-4 py-2 font-medium text-white disabled:opacity-60 ${
                  confirmingDelete ? "bg-red-700 hover:bg-red-800" : "bg-red-600 hover:bg-red-700"
                }`}
                disabled={submitting || deleting}
                aria-expanded={confirmingDelete} 
                aria-controls="delete-confirm-panel" 
              >
                {confirmingDelete ? "Confirm delete…" : (deleting ? "Deleting…" : "Delete")}
              </button>
            ) : (
              <span />
            )}

            <div className="flex-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-black hover:bg-gray-50"
                disabled={submitting || deleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-[#3E000C] px-4 py-2 font-medium text-white hover:bg-[#3E000C]/90 disabled:opacity-60"
                disabled={submitting || deleting}
              >
                {submitting ? "Saving..." : (mode === "create" ? "Save" : "Save changes")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
