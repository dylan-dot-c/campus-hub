"use client";

import { useRef, useState } from "react";
import { UpdateProfile } from "../../../packages/domain/src/schemas/profiles";

type Values = {
  description: string;
  linkedin: string;
  github: string;
  profileUrl: string;
  collegeId: string;
};
type Props = {
  initialValues: { [K in keyof Values]: string | null };
  colleges: { id: string; name: string }[];
};
const labels: Record<keyof Values, string> = {
  description: "Description", linkedin: "LinkedIn URL", github: "GitHub URL",
  profileUrl: "Avatar URL", collegeId: "College",
};

export default function ProfileForm({ initialValues, colleges }: Props) {
  const [values, setValues] = useState<Values>({
    description: initialValues.description ?? "", linkedin: initialValues.linkedin ?? "",
    github: initialValues.github ?? "", profileUrl: initialValues.profileUrl ?? "",
    collegeId: initialValues.collegeId ?? "",
  });
  const [status, setStatus] = useState<"editing" | "saving" | "saved" | "error">("editing");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const pending = useRef(false);
  const form = useRef<HTMLFormElement>(null);

  function edit(field: keyof Values, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setStatus("editing");
    setMessage("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending.current) return;
    const parsed = UpdateProfile.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof Values, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof Values;
        if (field in labels && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      const first = Object.keys(fieldErrors)[0];
      if (first) form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    pending.current = true;
    setStatus("saving");
    setErrors({});
    setMessage("");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/profiles/me", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data), signal: controller.signal,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setStatus("error");
        setMessage(body?.error?.message ?? "Could not save profile. Try again.");
        return;
      }
      setStatus("saved");
      setMessage("Profile saved");
    } catch {
      setStatus("error");
      setMessage(controller.signal.aborted
        ? "Saving timed out. Your changes may have saved; retry to confirm."
        : "Could not reach the server. Your edits are still here. Try again.");
    } finally {
      clearTimeout(timer);
      pending.current = false;
    }
  }

  const controlClass = "mt-1 block w-full rounded border border-neutral-400 bg-white p-2 text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700";
  return <form ref={form} onSubmit={submit} noValidate className="space-y-4">
    <p>All fields are optional. Clear a field to remove its saved value.</p>
    <fieldset disabled={status === "saving"} className="space-y-4">
      <legend className="sr-only">Profile information</legend>
      {(Object.keys(labels) as (keyof Values)[]).map((field) => {
        const props = {
          id: field, name: field, value: values[field], className: controlClass,
          "aria-invalid": Boolean(errors[field]),
          "aria-describedby": errors[field] ? `${field}-error` : undefined,
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => edit(field, event.target.value),
        };
        return <div key={field}>
          <label htmlFor={field} className="block font-medium">{labels[field]}</label>
          {field === "description" ? <textarea {...props} rows={4} />
            : field === "collegeId" ? <select {...props}>
              <option value="">No college selected</option>
              {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
            </select> : <input {...props} type="url" />}
          {errors[field] && <p id={`${field}-error`} className="text-red-700" role="alert">{errors[field]}</p>}
        </div>;
      })}
      <button type="submit" className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
        {status === "saving" ? "Saving…" : "Save profile"}
      </button>
    </fieldset>
    <p role="status" aria-live="polite">{status === "saving" ? "Saving profile…" : status === "saved" ? message : ""}</p>
    {status === "error" && <p role="alert" className="text-red-700">{message}</p>}
  </form>;
}
