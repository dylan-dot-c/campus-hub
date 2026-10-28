"use client";
import { useState } from "react";

const Profile = () => {
  const [description, setDescription] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [github, setGithub] = useState("");
  const [avatar, setAvatar] = useState("");
  const [college, setCollege] = useState("");

  return (
    <div>
      <form className="space-y-4 max-w-4xl border border-gray-300 p-4">
        <h1 className="text-2xl font-bold mb-4">Update Profile Information</h1>
        <div className="flex gap-4">
          <div className="flex gap-4 items-center">
            <label htmlFor="linkedin">LinkedIn URL</label>
            <input
              className="border border-gray-300 rounded-md  "
              type="text"
              id="linkedin"
              value={linkedIn}
              onChange={(e) => setLinkedIn(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="github">GitHub: </label>
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
          <label htmlFor="avatar">Avatar URL</label>
          <input
            className="border border-gray-300 rounded-md  "
            type="text"
            id="avatar"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="college">College</label>
          <input
            className="border border-gray-300 rounded-md  "
            type="text"
            id="college"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="description">Description</label>
          <textarea
            cols={70}
            className="border border-gray-300 rounded-md  "
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
};

export default Profile;
