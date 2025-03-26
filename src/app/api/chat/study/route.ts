import { authOptions } from "@/lib/auth";
import openai from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { fixChatMessages } from "@/lib/utils";
import { studySystem } from "@/prompt";
import {
  analystReportTool,
  interviewTool,
  reasoningThinkingTool,
  requestInteractionTool,
  saveAnalystStudySummaryTool,
  saveAnalystTool,
  scoutTaskChatTool,
  scoutTaskCreateTool,
  StatReporter,
  ToolName,
} from "@/tools";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { Message, streamText } from "ai";
import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

export const initStatReporter = (studyUserChatId: number): { statReport: StatReporter } => {
  const statReport: StatReporter = async (dimension, value, extra) => {
    await prisma.chatStatistics.create({
      data: {
        userChatId: studyUserChatId,
        dimension,
        value,
        extra: extra as InputJsonValue,
      },
    });
  };
  return { statReport };
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const payloadAwaited = await req.json();
  const chatId = parseInt(payloadAwaited["chatId"]);
  const messages = payloadAwaited["messages"] as Message[];

  const abortSignal = req.signal;
  const { statReport } = initStatReporter(chatId);
  let streamStartTime = Date.now();

  const result = streamText({
    // model: openai("o3-mini"),
    model: openai("claude-3-7-sonnet"),
    providerOptions: {
      openai: { stream_options: { include_usage: true } },
    },
    system: studySystem(),
    messages: fixChatMessages(messages),
    tools: {
      [ToolName.scoutTaskCreate]: scoutTaskCreateTool(userId),
      [ToolName.scoutTaskChat]: scoutTaskChatTool({ abortSignal, statReport }),
      [ToolName.saveAnalystStudySummary]: saveAnalystStudySummaryTool(),
      [ToolName.saveAnalyst]: saveAnalystTool(userId, chatId),
      [ToolName.interview]: interviewTool({ abortSignal, statReport }),
      [ToolName.analystReport]: analystReportTool,
      [ToolName.reasoningThinking]: reasoningThinkingTool({ abortSignal, statReport }),
      [ToolName.requestInteraction]: requestInteractionTool,
      // [ToolName.xhsSearch]: xhsSearchTool,
      // [ToolName.xhsUserNotes]: xhsUserNotesTool,
      // [ToolName.xhsNoteComments]: xhsNoteCommentsTool,
    },
    maxSteps: 3,
    onError: async (error) => {
      console.log("Error occurred:", error);
    },
    onStepFinish: async (step) => {
      if (step.usage.totalTokens > 0) {
        await Promise.all([
          statReport("tokens", step.usage.totalTokens, { reportedBy: "study chat" }),
        ]);
      }
    },
    onFinish: async (event) => {
      const seconds = Math.floor((Date.now() - streamStartTime) / 1000);
      streamStartTime = Date.now();
      await Promise.all([
        statReport("duration", seconds, { reportedBy: "study chat" }),
        statReport("steps", event.steps.length, { reportedBy: "study chat" }),
      ]);
    },
  });

  return result.toDataStreamResponse();
}
