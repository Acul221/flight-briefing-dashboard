import { useSession } from "@/hooks/useSession";
import { useSubscription } from "@/hooks/useSubscription";

/**
 * QuizGate
 * Wrapper to gate quiz questions based on user session & subscription
 *
 * Props:
 * - total: total number of questions
 * - children: rendered question components (JSX)
 */
export default function QuizGate({ total, children }) {
  const session = useSession();
  const { subscription } = useSubscription();

  let limit = 10; // default: guest & non-subscribed users get 10 questions

  if (session && subscription?.status === "active") {
    limit = total; // full access
  }

  const limitedChildren = Array.isArray(children)
    ? children.slice(0, limit)
    : children;

  return (
    <div className="space-y-4">
      {limitedChildren}

      {/* Guest mode */}
      {!session && (
        <div className="p-4 bg-yellow-100 border rounded text-center">
          🔑 You are in <b>Guest</b> mode. Login to access more questions.
          <br />
          <a className="text-blue-600 underline" href="/login">
            Login
          </a>
        </div>
      )}

      {/* Logged-in user but subscription inactive */}
      {session && subscription?.status !== "active" && (
        <div className="p-4 bg-blue-100 border rounded text-center">
          ⚡ Upgrade to <b>Pro</b> to unlock all questions.
          <br />
          <a className="text-blue-600 underline" href="/pricing">
            See Plans
          </a>
        </div>
      )}
    </div>
  );
}
