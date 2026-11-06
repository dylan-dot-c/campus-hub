import { Suspense } from "react";
import { redirect } from "next/navigation";
import { currentUserId } from "@project/auth";
import { getProfile, listColleges } from "@project/domain";
import ProfileForm from "@/components/ProfileForm";
import Loading from "./loading";

export const dynamic = "force-dynamic";

async function ProfileEditor({ userId }: { userId: string }) {
  const [profile, colleges] = await Promise.all([getProfile(userId), listColleges()]);
  if (!profile) return <section><h2>Profile not found</h2><p>No profile exists for your current account.</p><a href="/signup">Create an account</a></section>;
  const { description, linkedin, github, profileUrl, collegeId } = profile;
  return <ProfileForm initialValues={{ description, linkedin, github, profileUrl, collegeId }} colleges={colleges} />;
}

// gate before streaming starts — a redirect inside Suspense would arrive after the shell
export default async function Page() {
  const userId = await currentUserId();
  if (!userId) redirect("/login");
  return <div>
    <Suspense fallback={<Loading />}><ProfileEditor userId={userId} /></Suspense>
  </div>;
}
