import { countUnreadMessagesForUser } from "@/lib/services/messages";

export async function UnreadBadge({ userId }: { userId: string }) {
  const unreadCount = await countUnreadMessagesForUser(userId);

  if (!unreadCount) {
    return null;
  }

  return (
    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-sky-700 px-1.5 py-0.5 text-[11px] font-semibold text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}
