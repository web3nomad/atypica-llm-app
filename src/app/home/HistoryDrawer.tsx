"use client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { fetchUserChats, UserChat } from "@/data";
import { cn } from "@/lib/utils";
import { HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function StudyHistoryDrawer() {
  const t = useTranslations("HomePage.HistoryDrawer");
  const [chats, setChats] = useState<Omit<UserChat, "messages">[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const chats = await fetchUserChats("study");
        setChats(chats);
      } catch (error) {
        console.error("Failed to fetch active chats:", error);
      }
    };
    fetchChats();
    const interval = setInterval(() => {
      fetchChats();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectChat = (studyUserChatId: number) => {
    // const chat = await fetchUserChatById(studyUserChatId, "scout");
    window.location.replace(`/study?id=${studyUserChatId}`);
    setOpen(false); // Close drawer when a chat is selected
  };

  return (
    <Drawer direction="left" open={open} onOpenChange={setOpen} modal={true}>
      <DrawerTrigger asChild>
        <Button variant="ghost" className="size-8">
          <HistoryIcon className="size-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="w-[280px] mr-0 ml-auto">
        <DrawerHeader>
          <DrawerTitle className="text-center">{t("title")}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 space-y-2 overflow-y-scroll">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleSelectChat(chat.id)}
              className={cn(
                "px-3 py-2 text-sm truncate rounded-md cursor-pointer",
                "text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 hover:dark:bg-zinc-800 transition-colors",
              )}
            >
              {chat.title || t("unnamedChat")}
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
