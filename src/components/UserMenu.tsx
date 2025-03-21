"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

function LoginOrLogout() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <Button variant="ghost" size="sm" asChild>
        <Link href="/auth/signin">登录</Link>
      </Button>
    );
  }

  const userInitial = session.user?.email?.charAt(0) || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Avatar className="size-8 cursor-pointer">
          <AvatarImage src={""} />
          <AvatarFallback>{userInitial}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>退出登录</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function UserMenu() {
  return (
    <div className="fixed right-0 top-0 sm:mx-2 2xl:mx-6 mt-2 2xl:mt-6 hidden sm:block">
      <LoginOrLogout />
    </div>
  );
}
