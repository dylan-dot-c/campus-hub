"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const Profile = () => {
  const [description, setDescription] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [github, setGithub] = useState("");
  const [avatar, setAvatar] = useState("");
  const [college, setCollege] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description, linkedIn, github, avatar, college }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error?.message ?? "Something went wrong");
      return;
    }

    setDescription("");
    setLinkedIn("");
    setGithub("");
    setAvatar("");
    setCollege("");
    router.refresh();
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-4xl border border-gray-300 p-4"
      >
        <h1 className="text-2xl font-bold mb-4">Update Profile Information</h1>
        <div className="flex gap-4">
          <div className="flex flex-col">
            <label htmlFor="linkedin" className="block">
              LinkedIn URL
            </label>
            <input
              className="border block border-gray-300 rounded-md  "
              type="text"
              id="linkedin"
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="github" className="block">
              GitHub:{" "}
            </label>
            <input
              className="border border-gray-300 rounded-md  w-auto"
              type="text"
              id="github"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label htmlFor="avatar" className="block">
            Avatar URL
          </label>
          <input
            className="border border-gray-300 rounded-md  "
            type="text"
            id="avatar"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="college" className="block">
            College
          </label>
          <input
            className="border border-gray-300 rounded-md  "
            type="text"
            id="college"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="description" className="block">
            Description
          </label>
          <textarea
            cols={70}
            className="border border-gray-300 rounded-md  "
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {busy ? (
          <button
            disabled={busy}
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
