import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const exists = await prisma.user.findUnique({
      where: { email },
    });
    if (exists) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }
    const hashedPassword = await hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });
    try {
      // 给每个用户关联一个样例主题
      await prisma.userAnalyst.create({
        data: {
          userId: user.id,
          analystId: 1,
        },
      });
    } catch (error) {
      console.log("Failed to create userAnalyst:", error);
    }
    return NextResponse.json({
      user: {
        email: user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
}
