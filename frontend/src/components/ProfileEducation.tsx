import React, { useState } from "react";
import type { Education, AddEducationRequest } from "../lib/api/profile";
import { profileApi, ProfileApiError } from "../lib/api/profile";
import { ArrowDownToLine, Plus } from "lucide-react";
import { EducationModal } from "./ui/EducationModal";

interface ProfileEducationProps {
  educations: Education[];
  /** Optional: parent can optimistically add the new item without refetching */
  onEducationAdded?: (edu: Education) => void;
}

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmtMonthYear(month: number, year: number) {
  return `${MONTHS[month]} ${year}`;
}

function labelRange(e: Education) {
  const start = fmtMonthYear(e.startMonth, e.startYear);
  const end = e.endYear ? fmtMonthYear(e.endMonth ?? 1, e.endYear) : "Present";
  return `${start} - ${end}`;
}

function toDate(year: number, month: number) {
  return new Date(year, month - 1, 1);
}

function labelDuration(e: Education) {
  const start = toDate(e.startYear, e.startMonth);
  const end = e.endYear ? toDate(e.endYear, e.endMonth ?? 1) : new Date();
  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const months = Math.ceil(diffMs / (1000 * 60 * 60 * 24 * 30.44));

  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;

  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem
    ? `${years} year${years === 1 ? "" : "s"} ${rem} month${rem === 1 ? "" : "s"}`
    : `${years} year${years === 1 ? "" : "s"}`;
}

export function ProfileEducation({ educations, onEducationAdded }: ProfileEducationProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AddEducationRequest>({
    school: "",
    program: "",
    major: "",
    startMonth: 1,
    startYear: new Date().getFullYear(),
    endMonth: null,
    endYear: null,
  });
  const [isCurrent, setIsCurrent] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const resetModal = () => {
    setForm({
      school: "",
      program: "",
      major: "",
      startMonth: 1,
      startYear: new Date().getFullYear(),
      endMonth: null,
      endYear: null,
    });
    setIsCurrent(true);
    setFieldErrors({});
    setFormError(null);
  };

  const openModal = () => {
    resetModal();
    setOpen(true);
  };
  const closeModal = () => setOpen(false);

  const handleChange = (key: keyof AddEducationRequest, value: string | number | null) => {
    setForm((f) => ({ ...f, [key]: value as any }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const payload: AddEducationRequest = isCurrent
      ? { ...form, endMonth: null, endYear: null }
      : form;

    try {
      // singular method name
      const { id } = await profileApi.addEducations(payload);

      // optimistic add
      const newEdu: Education = {
        id,
        school: payload.school,
        program: payload.program,
        major: payload.major,
        startMonth: payload.startMonth,
        startYear: payload.startYear,
        endMonth: payload.endMonth,
        endYear: payload.endYear,
      };

      onEducationAdded?.(newEdu);
      setOpen(false);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        if (err.code === "VALIDATION_ERROR" && err.details?.fieldErrors) {
          setFieldErrors(err.details.fieldErrors as Record<string, string[]>);
          setFormError(err.details.formErrors?.[0] ?? null);
        } else if (err.code === "NOT_AUTHENTICATED") {
          setFormError("Please sign in to add education.");
        } else {
          setFormError(err.message || "Failed to add education.");
        }
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const HeaderRight = (
    <button
      type="button"
      onClick={openModal}
      className="text-gray-700 hover:text-gray-500"
    >
      <Plus className="size-6 mr-1" />
    </button>
  );

  if (!educations || educations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex-between w-full mb-4">
          <h2 className="text-xl font-bold text-gray-900">Education</h2>
          {HeaderRight}
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-2">
            <ArrowDownToLine className="w-12 h-12" />
          </div>
          <p className="text-gray-500 text-sm">Add your education</p>
        </div>

        {open && (
          <EducationModal
            open={open}
            onClose={closeModal}
            onSubmit={handleSubmit}
            submitting={submitting}
            form={form}
            isCurrent={isCurrent}
            setIsCurrent={setIsCurrent}
            handleChange={handleChange}
            fieldErrors={fieldErrors}
            formError={formError}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex-between w-full mb-4">
        <h2 className="text-xl font-bold text-gray-900">Education</h2>
        {HeaderRight}
      </div>

      <div className="space-y-6">
        {educations.map((edu, idx) => {
          const isCurrent = edu.endYear == null;
          const headline = [edu.program, edu.major]
            .filter((s): s is string => !!s && s.trim().length > 0)
            .join(" - ");

          return (
            <div key={edu.id} className="relative">
              {idx < educations.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-14 bg-gray-200" />
              )}

              <div className="flex items-start space-x-4">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex-center flex-shrink-0 ${
                    isCurrent ? "border-[#3E000C] bg-[#3E000C]" : "border-gray-300 bg-white"
                  }`}
                >
                  {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{edu.school}</h3>
                      {headline && <p className="text-[#3E000C] font-medium">{headline}</p>}
                    </div>
                    <div className="mt-2 sm:mt-0 sm:text-right">
                      <p className=" text-gray-600 font-medium">{labelRange(edu)}</p>
                      <p className="text-sm text-gray-500">{labelDuration(edu)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <EducationModal
          open={open}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          form={form}
          isCurrent={isCurrent}
          setIsCurrent={setIsCurrent}
          handleChange={handleChange}
          fieldErrors={fieldErrors}
          formError={formError}
        />
      )}
    </div>
  );
}
