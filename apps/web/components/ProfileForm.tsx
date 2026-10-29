"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { type SubmitHandler, useForm } from "react-hook-form";

type ProfileForm = {
  linkedIn: string;
  github: string;
  avatar: string;
  college: string;
  description: string;
  classStanding: string;
};
// LinkedIn profile URL
const linkedinRegex =
  /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_%\-]+\/?$/;

// GitHub profile URL
const githubRegex =
  /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?\/?$/;

// Image URL (URL ending in a common image extension)
const imageUrlRegex =
  /^https?:\/\/.+\.(?:jpg|jpeg|png|gif|webp|svg|avif)(?:\?.*)?$/i;

const Profile = () => {
  // const [linkedIn, setLinkedIn] = useState("");

  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    defaultValues: {
      linkedIn: "",
      github: "",
      avatar: "",
      college: "",
      description: "",
      classStanding: "",
    },
  });

  const colleges = ["Lehman College", "BCC", "City College", "Hunter College"];
  const standings = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"];

  console.log(errors);

  const onSubmit: SubmitHandler<ProfileForm> = async (data) => {
    setError(null);
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "Something went wrong");
      return;
    }
    router.refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Update Profile Information</h1>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 max-w-4xl border border-gray-300 p-4"
      >
        <div className="flex justify-between ">
          <div className="flex flex-col">
            <label htmlFor="linkedin" className="block">
              LinkedIn URL
            </label>
            <input
              {...register("linkedIn", {
                required: "LinkedIn URL is required",
                pattern: {
                  value: linkedinRegex,
                  message: "Invalid LinkedIn URL",
                },
              })}
              className="border block border-gray-300 rounded-md  "
              type="text"
              id="linkedin"
              aria-invalid={errors.linkedIn ? "true" : "false"}
            />
            {errors.linkedIn && (
              <p className="text-red-500" role="alert">
                {errors.linkedIn?.message}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="github" className="block">
              GitHub:{" "}
            </label>
            <input
              className="border border-gray-300 rounded-md  w-auto"
              type="text"
              id="github"
              {...register("github", {
                required: "Github is required",
                pattern: {
                  value: githubRegex,
                  message: "Invalid GitHub URL",
                },
              })}
              aria-invalid={errors.github ? "true" : "false"}
            />
            {errors.github && <p role="alert">{errors.github?.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="avatar" className="block">
            Avatar URL
          </label>
          <input
            {...register("avatar", {
              required: "Avatar URL is required",
              pattern: {
                value: imageUrlRegex,
                message: "Invalid image URL",
              },
            })}
            className="border border-gray-300 rounded-md  "
            type="text"
            id="avatar"
            aria-invalid={errors.avatar ? "true" : "false"}
          />
          {errors.avatar && <p role="alert">{errors.avatar?.message}</p>}
        </div>
        <div>
          <label htmlFor="college" className="block">
            College
          </label>
          <select
            className="border border-gray-300 rounded-md  "
            id="college"
            {...register("college", { required: "College is required" })}
            aria-invalid={errors.college ? "true" : "false"}
          >
            <option value="">Select your college</option>
            {colleges.map((college) => (
              <option key={college} value={college}>
                {college}
              </option>
            ))}
          </select>
          {errors.college && <p role="alert">{errors.college?.message}</p>}
        </div>

        <div>
          <label htmlFor="standing" className="block">
            Standing
          </label>
          <select
            className="border border-gray-300 rounded-md  "
            id="standing"
            {...register("classStanding", { required: "Standing is required" })}
            aria-invalid={errors.classStanding ? "true" : "false"}
          >
            <option value="">Select your Standing</option>
            {standings.map((standing) => (
              <option key={standing} value={standing}>
                {standing}
              </option>
            ))}
          </select>
          {errors.classStanding && (
            <p role="alert">{errors.classStanding?.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block">
            Description
          </label>
          <textarea
            cols={70}
            className="border border-gray-300 rounded-md  "
            id="description"
            {...register("description", {
              required: "Description is required",
              minLength: {
                value: 30,
                message: "Description is too short",
              },
            })}
            aria-invalid={errors.description ? "true" : "false"}
          />
          {errors.description && (
            <p role="alert">{errors.description?.message}</p>
          )}
        </div>

        {isSubmitting ? (
          <button
            disabled={true}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Loading...
          </button>
        ) : (
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Save Profile
          </button>
        )}
        {error && <p className="self-center text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
};

export default Profile;
