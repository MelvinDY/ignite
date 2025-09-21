import React, { useState } from "react";
import type { Education, AddEducationRequest } from "../lib/api/profile";
import { profileApi, ProfileApiError } from "../lib/api/profile";
import { ArrowDownToLine, Plus } from "lucide-react";
import { EducationModal } from "./ui/EducationModal";

interface ProfileEducationProps {
  educations: Education[];
  onEducationAdded?: (edu: Education) => void;
  onEducationUpdated?: (edu: Education) => void;
  onEducationDeleted?: (id: string) => void;
}

const MONTHS = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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
    ? `${years} year${years === 1 ? "" : "s"} ${rem} month${
        rem === 1 ? "" : "s"
      }`
    : `${years} year${years === 1 ? "" : "s"}`;
}

export function ProfileEducation({
  educations,
  onEducationAdded,
  onEducationUpdated,
  onEducationDeleted,
}: ProfileEducationProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  // const [open, setOpen] = useState(false);
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
  const [deleting, setDeleting] = useState(false);

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

  const openCreate = () => {
    resetModal();
    setModalMode("create");
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (edu: Education) => {
    setForm({
      school: edu.school ?? "",
      program: edu.program ?? "",
      major: edu.major ?? "",
      startMonth: edu.startMonth,
      startYear: edu.startYear,
      endMonth: edu.endMonth ?? null,
      endYear: edu.endYear ?? null,
    });

    setIsCurrent(edu.endYear == null);
    setFieldErrors({});
    setFormError(null);
    setModalMode("edit");
    setEditingId(edu.id);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  // const handleChange = (
  //   key: keyof AddEducationRequest,
  //   value: string | number | null
  // ) => {
  //   setOpen(true);
  // };
  // const closeModal = () => setOpen(false);

  const handleChange = (
    key: keyof AddEducationRequest,
    value: string | number | null
  ) => {
    setForm((f) => ({ ...f, [key]: value as any }));
  };

  React.useEffect(() => {
    setForm((f) => (isCurrent ? { ...f, endMonth: null, endYear: null } : f));
  }, [isCurrent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);

    const payload: AddEducationRequest = isCurrent
      ? { ...form, endMonth: null, endYear: null }
      : form;

    try {
      if (modalMode === "create") {
        // create
        const { id } = await profileApi.addEducations(payload);
        const newEdu: Education = { id, ...payload };
        onEducationAdded?.(newEdu);
      } else {
        // edit
        if (!editingId) throw new Error("Missing education id for edit");
        await profileApi.updateEducations(editingId, payload);
        const updated: Education = { id: editingId, ...payload };
        onEducationUpdated?.(updated);
      }

      setModalOpen(false);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        if (err.code === "VALIDATION_ERROR" && err.details?.fieldErrors) {
          setFieldErrors(err.details.fieldErrors as Record<string, string[]>);
          setFormError(err.details.formErrors?.[0] ?? null);
        } else if (err.code === "NOT_AUTHENTICATED") {
          setFormError(
            modalMode === "create"
              ? "Please sign in to add education."
              : "Please sign in to edit education."
          );
        } else {
          setFormError(
            err.message ||
              (modalMode === "create"
                ? "Failed to add education."
                : "Failed to edit education.")
          );
        }
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  async function handleDelete() {
    if (!editingId) return;

    setDeleting(true);
    setFormError(null);

    try {
      await profileApi.deleteEducation(editingId); // CHANGED
      onEducationDeleted?.(editingId); // CHANGED: notify parent
      setModalOpen(false);
    } catch (err) {
      if (err instanceof ProfileApiError) {
        setFormError(err.message || "Failed to delete education.");
      } else {
        setFormError("Something went wrong.");
      }
    } finally {
      setDeleting(false);
    }
  }

  const HeaderRight = (
    <button
      type="button"
      onClick={openCreate}
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

        {modalOpen && (
          <EducationModal
            open={modalOpen}
            onClose={closeModal}
            onSubmit={handleSubmit}
            submitting={submitting}
            form={form}
            isCurrent={isCurrent}
            setIsCurrent={setIsCurrent}
            handleChange={handleChange}
            fieldErrors={fieldErrors}
            formError={formError}
            mode={modalMode}
            onDelete={modalMode === "edit" ? handleDelete : undefined}
            deleting={deleting}
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
                <div className="absolute left-4 top-8 w-0.5 h-28 sm:h-20 bg-gray-200" />
              )}

              <div className="flex items-start space-x-4">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex-center flex-shrink-0 ${
                    isCurrent
                      ? "border-[var(--dark-red)] bg-[var(--dark-red)]"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isCurrent && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                    <div>
                      <button
                        type="button"
                        onClick={() => openEdit(edu)}
                        className="text-left group focus:outline-none"
                        aria-label={`Edit ${edu.school}`}
                      >
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:underline">
                          {edu.school}
                        </h3>
                        {headline && (
                          <p className="text-[#3E000C] font-medium">
                            {headline}
                          </p>
                        )}
                      </button>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {edu.school}
                      </h3>
                      {headline && (
                        <p className="text-[var(--dark-red)] font-medium">
                          {headline}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 sm:mt-0 sm:text-right">
                      <p className=" text-gray-600 font-medium">
                        {labelRange(edu)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {labelDuration(edu)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <EducationModal
          open={modalOpen}
          onClose={closeModal}
          onSubmit={handleSubmit}
          submitting={submitting}
          form={form}
          isCurrent={isCurrent}
          setIsCurrent={setIsCurrent}
          handleChange={handleChange}
          fieldErrors={fieldErrors}
          formError={formError}
          mode={modalMode}
          onDelete={modalMode === "edit" ? handleDelete : undefined}
          deleting={deleting}
        />
      )}
    </div>
  );
}
