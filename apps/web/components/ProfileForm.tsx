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

  const controlClass = "border block border-gray-300 rounded-md";
  function fieldProps(field: keyof Values, id: string = field) {
    return {
      id, name: field, value: values[field], className: controlClass,
      "aria-invalid": Boolean(errors[field]),
      "aria-describedby": errors[field] ? `${id}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => edit(field, event.target.value),
    };
  }
  function fieldError(field: keyof Values, id: string = field) {
    return errors[field] && <p id={`${id}-error`} className="text-red-500" role="alert">{errors[field]}</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Update Profile Information</h1>
      <form ref={form} onSubmit={submit} noValidate className="space-y-4 max-w-4xl border border-gray-300 p-4">
        <fieldset disabled={status === "saving"} className="space-y-4">
          <legend className="sr-only">Profile information</legend>
          <div className="flex justify-between">
            <div className="flex flex-col">
              <label htmlFor="linkedin" className="block">LinkedIn URL</label>
              <input {...fieldProps("linkedin")} type="text" />
              {fieldError("linkedin")}
            </div>
            <div>
              <label htmlFor="github" className="block">GitHub: </label>
              <input {...fieldProps("github")} className={`${controlClass} w-auto`} type="text" />
              {fieldError("github")}
            </div>
          </div>
          <div>
            <label htmlFor="avatar" className="block">Avatar URL</label>
            <input {...fieldProps("profileUrl", "avatar")} type="text" />
            {fieldError("profileUrl", "avatar")}
          </div>
          <div>
            <label htmlFor="college" className="block">College</label>
            <select {...fieldProps("collegeId", "college")}>
              <option value="">Select your college</option>
              {colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}
            </select>
            {fieldError("collegeId", "college")}
          </div>
          <div>
            <label htmlFor="standing" className="block">Standing</label>
            <select id="standing" className={controlClass} disabled aria-describedby="standing-help" defaultValue="">
              <option value="">Select your Standing</option>
              {["Freshman", "Sophomore", "Junior", "Senior", "Graduate"].map((standing) => <option key={standing} value={standing}>{standing}</option>)}
            </select>
            <p id="standing-help" className="text-sm">Standing is not available to save yet.</p>
          </div>
          <div>
            <label htmlFor="description" className="block">Description</label>
            <textarea {...fieldProps("description")} cols={70} />
            {fieldError("description")}
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md">
            {status === "saving" ? "Loading..." : "Save Profile"}
          </button>
        </fieldset>
        <p role="status" aria-live="polite">{status === "saving" ? "Saving profile…" : status === "saved" ? message : ""}</p>
        {status === "error" && <p role="alert" className="self-center text-sm text-red-600">{message}</p>}
      </form>
    </div>
  );
}
