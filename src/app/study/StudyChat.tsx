"use client";
import { Button } from "@/components/ui/button";
import { UserChat } from "@/data";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StudyChatHistory } from "./StudyChatHistory";
import { StudyChatMessages } from "./StudyChatMessages";

export function StudyChat() {
  const router = useRouter();
  const [currentChat, setCurrentChat] = useState<UserChat | null>(null);

  return (
    <div className="flex flex-col items-stretch justify-between gap-4 max-w-5xl mx-auto h-dvh py-6">
      <div className="relative w-full">
        <div className="absolute left-0 top-1/2 -translate-y-1/2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← 返回
          </Button>
        </div>
        <h1 className="sm:text-lg font-medium px-18 text-center truncate">
          {currentChat?.title || "研究"}
        </h1>
        <div className="absolute right-0 top-1/2 -translate-y-1/2">
          <StudyChatHistory onSelectChat={setCurrentChat} />
        </div>
      </div>
      <StudyChatMessages currentChat={currentChat} />
    </div>
  );
}
