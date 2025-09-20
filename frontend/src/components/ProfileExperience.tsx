import React, { useState } from "react";
import type { Experience, CreateExperienceRequest, UpdateExperienceRequest } from "../lib/api/profile";
import { profileApi, ProfileApiError } from "../lib/api/profile";
import { ArrowDownToLine, Plus, Edit, Trash2 } from "lucide-react";
import { ExperienceModal } from "./ui/ExperienceModal";
interface ProfileExperienceProps {
  experiences: Experience[];
  isOwnProfile?: boolean;
  onExperienceAdded?: (exp: Experience) => void;
  onExperienceUpdated?: (id: string, exp: Partial<Experience>) => void;
  onExperienceDeleted?: (id: string) => void;
}
const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtMonthYear(month: number, year: number) {
  return `${MONTHS[month]} ${year}`;
}
function labelRange(e: Experience) {
  const start = fmtMonthYear(e.startMonth, e.startYear);
  const end = e.endYear ? fmtMonthYear(e.endMonth ?? 1, e.endYear) : "Present";
  return `${start} - ${end}`;
}
function toDate(year: number, month: number) {
  return new Date(year, month - 1, 1);
}
function labelDuration(e: Experience) {
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
export function ProfileExperience({
  experiences,
  isOwnProfile = false,
  onExperienceAdded,
  onExperienceUpdated,
  onExperienceDeleted
}: ProfileExperienceProps) {
  const [open, setOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateExperienceRequest>({
    roleTitle: "",
    company: "",
    fieldOfWork: "",
    employmentType: undefined,
    locationCity: "",
    locationCountry: "",
    locationType: undefined,
    startMonth: 1,
    startYear: new Date().getFullYear(),
    endMonth: null,
    endYear: null,
    isCurrent: true,
    description: "",
  });
  const [isCurrent, setIsCurrent] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const resetModal = () => {
    setForm({
      roleTitle: "",
      company: "",
      fieldOfWork: "",
      employmentType: undefined,
      locationCity: "",
      locationCountry: "",
      locationType: undefined,
      startMonth: 1,
      startYear: new Date().getFullYear(),
      endMonth: null,
      endYear: null,
      isCurrent: true,
      description: "",
    });
    setIsCurrent(true);
    setFieldErrors({});
    setFormError(null);
    setEditingExperience(null);
  };


  const openModal = (experience?: Experience) => {
    resetModal();
    if (experience) {
      setEditingExperience(experience);
      setForm({
        roleTitle: experience.title,
        company: experience.company || "",
        fieldOfWork: experience.fieldOfWork || "",
        employmentType: experience.employmentType as any,
        locationCity: experience.locationCity || "",
        locationCountry: experience.locationCountry || "",
        locationType: experience.locationType as any,
        startMonth: experience.startMonth,
        startYear: experience.startYear,
        endMonth: experience.endMonth,
        endYear: experience.endYear,
        isCurrent: experience.isCurrent,
        description: experience.description || "",
      });
      setIsCurrent(experience.isCurrent);
    }
    setOpen(true);
  };
  const closeModal = () => {
    setOpen(false);
    setEditingExperience(null);
  };
  const handleChange = (key: keyof CreateExperienceRequest, value: string | number | null | boolean) => {
    setForm((f) => ({ ...f, [key]: value as any }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      if (editingExperience) {
        // Build update payload specifically for updates
        const updatePayload: UpdateExperienceRequest = isCurrent
          ? { ...form, endMonth: null, endYear: null, isCurrent: true }
          : { ...form, isCurrent: false };
        await profileApi.updateExperience(editingExperience.id, updatePayload);
        onExperienceUpdated?.(editingExperience.id, updatePayload as Partial<Experience>);
      } else {
        // Build create payload for new experiences
        const createPayload: CreateExperienceRequest = isCurrent
          ? { ...form, endMonth: null, endYear: null, isCurrent: true }
          : { ...form, isCurrent: false };
        const { id } = await profileApi.createExperience(createPayload);
        const newExp: Experience = {
          id,
          title: createPayload.roleTitle,
          company: createPayload.company,
          fieldOfWork: createPayload.fieldOfWork || null,
          startMonth: createPayload.startMonth,
          startYear: createPayload.startYear,
          endMonth: createPayload.endMonth ?? null,
          endYear: createPayload.endYear ?? null,
          isCurrent: createPayload.isCurrent,
          employmentType: createPayload.employmentType || null,
          locationCity: createPayload.locationCity || null,
          locationCountry: createPayload.locationCountry || null,
          locationType: createPayload.locationType || null,
          description: createPayload.description || null,
        };
        onExperienceAdded?.(newExp);
      }
      setOpen(false);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        if (err.code === "VALIDATION_ERROR" && err.details?.fieldErrors) {
          setFieldErrors(err.details.fieldErrors as Record<string, string[]>);
          setFormError(err.details.formErrors?.[0] ?? null);
        } else if (err.code === "NOT_AUTHENTICATED") {
          setFormError("Please sign in to manage experience.");
        } else {
          setFormError(err.message || "Failed to save experience.");
        }
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };
  const handleDelete = async (experienceId: string) => {
    if (!confirm("Are you sure you want to delete this experience?")) {
      return;
    }
    try {
      await profileApi.deleteExperience(experienceId);
      onExperienceDeleted?.(experienceId);
    } catch (err) {
      console.error("Failed to delete experience:", err);
    }
  };
  const HeaderRight = isOwnProfile ? (
    <button
      type="button"
      onClick={() => openModal()}
      className="text-gray-700 hover:text-gray-500"
    >
      <Plus className="size-6 mr-1" />
    </button>
  ) : null;
  if (!experiences || experiences.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex-between w-full mb-4">
          <h2 className="text-xl font-bold text-gray-900">Experience</h2>
          {HeaderRight}
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-400 mb-2">
            <ArrowDownToLine className="w-12 h-12" />
          </div>
          <p className="text-gray-500 text-sm">Add your experience</p>
        </div>
        {open && (
          <ExperienceModal
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
            editingExperience={editingExperience}
          />
        )}
      </div>
    );
  }
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex-between w-full mb-4">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
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
        {HeaderRight}
      </div>
      <div className="space-y-6">
        {experiences.map((exp, idx) => {
          const isCurrentExp = exp.isCurrent;
          return (
            <div key={exp.id} className="relative pb-6 group">
              {idx < experiences.length - 1 && (
                <div
                  className="absolute bg-gray-200 z-0"
                  style={{
                    left: '16px',
                    top: '32px',
                    width: '2px',
                    height: 'calc(100% - 8px)'
                  }}
                />
              )}
              <div className="flex items-start space-x-4">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex-center flex-shrink-0 ${
                    isCurrentExp ? "border-[#3E000C] bg-[#3E000C]" : "border-gray-300 bg-white"
                  }`}
                >
                  {isCurrentExp && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2 gap-4">
                    <div className="flex-1 min-w-0 max-w-xs sm:max-w-md">
                      <h3 className="text-lg font-semibold text-gray-900 truncate" title={exp.title}>
                        {exp.title}
                      </h3>
                      {exp.company && (
                        <p className="text-[#3E000C] font-medium truncate" title={exp.company}>
                          {exp.company}
                        </p>
                      )}
                      {exp.fieldOfWork && (
                        <p className="text-sm text-gray-600 truncate" title={exp.fieldOfWork}>
                          {exp.fieldOfWork}
                        </p>
                      )}
                      {(exp.locationCity || exp.locationType) && (
                        <p className="text-sm text-gray-500 truncate">
                          {[exp.locationCity, exp.locationType?.replace('_', ' ')].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start space-x-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-gray-600 font-medium whitespace-nowrap">{labelRange(exp)}</p>
                        <p className="text-sm text-gray-500 whitespace-nowrap">{labelDuration(exp)}</p>
                      </div>
                      {isOwnProfile && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                          <button
                            onClick={() => openModal(exp)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
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
          );
        })}
      </div>
      {open && (
        <ExperienceModal
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
          editingExperience={editingExperience}
        />
      )}
    </div>
  );
}