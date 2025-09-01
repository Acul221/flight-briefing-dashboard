import { useProfile } from "@/hooks/useProfile";

export default function TestAdmin() {
  const { profile } = useProfile();

  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <p>Email: {profile.email}</p>
      <p>Role: {profile.role}</p>
      {profile.role === "admin" ? (
        <p className="text-green-600 font-bold">✅ You are Admin</p>
      ) : (
        <p className="text-red-600 font-bold">👤 Regular User</p>
      )}
    </div>
  );
}
