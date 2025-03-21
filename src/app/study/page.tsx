import { fetchUserChatById } from "@/data";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { StudyPageClient } from "./StudyPageClient";

export const dynamic = "force-dynamic";

export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; replay?: string }>;
}) {
  const { id, replay } = await searchParams;
  if (!id) {
    redirect("/");
  }
  const chatId = parseInt(id);

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/study");
  }

  const userChat = await fetchUserChatById(chatId, "study");
  // @AUTHTODO: 读取 Analyst 暂时不需要 user 有 Analyst 权限，不过前端要限制只读
  // if (userChat.userId !== session.user.id) {
  //   forbidden();
  // }

  return (
    <StudyPageClient
      studyChat={userChat}
      readOnly={userChat.userId !== session.user.id}
      replay={replay === "1"}
    />
  );
}
