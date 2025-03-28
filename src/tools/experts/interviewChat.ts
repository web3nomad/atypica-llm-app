import { Analyst, Persona } from "@/data";
import openai from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import { streamStepsToUIMessage } from "@/lib/utils";
import { interviewerPrologue, interviewerSystem, personaAgentSystem } from "@/prompt";
import { PlainTextToolResult } from "@/tools/utils";
import { InputJsonValue } from "@prisma/client/runtime/library";
import { generateId, Message, streamText, tool } from "ai";
import { z } from "zod";
import { StatReporter, ToolName } from "..";
import { saveInterviewConclusionTool } from "../system/saveInterviewConclusion";
import { xhsSearchTool } from "../xhs/search";
import { reasoningThinkingTool } from "./reasoning";

export interface InterviewChatResult extends PlainTextToolResult {
  interviews: {
    analystId: number;
    personaId: number;
    personaName: string;
    conclusion?: string;
    result: string;
  }[];
  plainText: string;
}

export const interviewChatTool = ({
  abortSignal,
  statReport,
}: {
  abortSignal: AbortSignal;
  statReport: StatReporter;
}) =>
  tool({
    description: "针对一个调研主题的一系列用户进行访谈，每次最多5人",
    parameters: z.object({
      analystId: z.number().describe("调研主题的ID"),
      personas: z
        .array(
          z.object({
            id: z.number().describe("调研对象的ID"),
            name: z.string().describe("调研对象的姓名"),
          }),
        )
        .describe("调研对象的列表，最多5人"),
    }),
    experimental_toToolResultContent: (result: PlainTextToolResult) => {
      return [{ type: "text", text: result.plainText }];
    },
    execute: async ({ analystId, personas }): Promise<InterviewChatResult> => {
      const single = async ({ id: personaId, name: personaName }: { id: number; name: string }) => {
        const [interview, persona, analyst] = await Promise.all([
          prisma.analystInterview.upsert({
            where: { analystId_personaId: { analystId, personaId } },
            update: {},
            create: {
              analystId,
              personaId,
              personaPrompt: "",
              interviewerPrompt: "",
              messages: [],
              conclusion: "",
            },
          }),
          prisma.persona.findUniqueOrThrow({ where: { id: personaId } }),
          prisma.analyst.findUniqueOrThrow({ where: { id: analystId } }),
        ]);
        try {
          await startInterview({
            analyst,
            persona: {
              ...persona,
              tags: persona.tags as string[],
            },
            analystInterviewId: interview.id,
            abortSignal,
            statReport,
          });
          const updatedInterview = await prisma.analystInterview.findUniqueOrThrow({
            where: { id: interview.id },
          });
          return {
            analystId,
            personaId,
            personaName,
            conclusion: updatedInterview.conclusion,
            result: "访谈结束",
          };
        } catch (error) {
          return {
            analystId,
            personaId,
            personaName,
            result: `访谈遇到问题 ${(error as Error).message}`,
          };
        }
      };
      const interviewResults = await Promise.all(personas.map(single));
      await new Promise((resolve) => {
        // 等 5s, 确保前端可以把 conclusion 显示出来
        setTimeout(() => resolve(null), 5000);
      });
      return {
        interviews: interviewResults,
        plainText: JSON.stringify(interviewResults),
      };
    },
  });

type ChatProps = {
  messages: Message[];
  persona: Persona;
  analyst: Analyst;
  analystInterviewId: number;
  interviewToken: string;
  abortSignal: AbortSignal;
  statReport: StatReporter;
};

async function chatWithInterviewer({
  messages,
  analyst,
  analystInterviewId,
  interviewToken,
  abortSignal,
  statReport,
}: ChatProps) {
  const result = await new Promise<Omit<Message, "role">>(async (resolve, reject) => {
    const response = streamText({
      model: openai("gpt-4o"),
      providerOptions: {
        openai: { stream_options: { include_usage: true } },
      },
      system: interviewerSystem(analyst),
      messages,
      tools: {
        [ToolName.reasoningThinking]: reasoningThinkingTool({ abortSignal, statReport }),
        [ToolName.saveInterviewConclusion]: saveInterviewConclusionTool(
          analystInterviewId,
          interviewToken,
        ),
      },
      maxSteps: 3,
      onChunk: (chunk) =>
        console.log(`[${analystInterviewId}] Interviewer:`, JSON.stringify(chunk)),
      onStepFinish: async (step) => {
        if (step.usage.totalTokens > 0) {
          await statReport("tokens", step.usage.totalTokens, {
            reportedBy: "interview tool",
            analystInterviewId,
            role: "interviewer",
          });
        }
      },
      onFinish: async ({ steps }) => {
        const message = streamStepsToUIMessage(steps);
        resolve(message);
      },
      onError: (error) => {
        console.log(error);
        reject(error);
      },
      abortSignal,
    });
    await response.consumeStream();
    // 必须写这个 await，把 stream 消费完，也可以使用 consumeStream 方法
    // for await (const textPart of response.textStream) { console.log(textPart); }
  });
  return result;
}

async function chatWithPersona({
  messages,
  persona,
  analystInterviewId,
  abortSignal,
  statReport,
}: Omit<ChatProps, "interviewToken">) {
  const result = await new Promise<Omit<Message, "role">>(async (resolve, reject) => {
    const response = streamText({
      model: openai("gpt-4o-mini"),
      providerOptions: {
        openai: { stream_options: { include_usage: true } },
      },
      system: personaAgentSystem(persona),
      messages,
      tools: {
        [ToolName.xhsSearch]: xhsSearchTool,
      },
      maxSteps: 3,
      onChunk: (chunk) => console.log(`[${analystInterviewId}] Persona:`, JSON.stringify(chunk)),
      onStepFinish: async (step) => {
        if (step.usage.totalTokens > 0) {
          await statReport("tokens", step.usage.totalTokens, {
            reportedBy: "interview tool",
            analystInterviewId,
            role: "persona",
          });
        }
      },
      onFinish: ({ steps }) => {
        const message = streamStepsToUIMessage(steps);
        resolve(message);
      },
      onError: (error) => {
        console.log(error);
        reject(error);
      },
      abortSignal,
    });
    await response.consumeStream();
  });
  return result;
}

async function saveMessages({
  messages,
  analystInterviewId,
  interviewToken,
}: {
  messages: Message[];
  analystInterviewId: number;
  interviewToken: string;
}) {
  try {
    await prisma.analystInterview.update({
      where: {
        id: analystInterviewId,
        interviewToken,
      },
      data: {
        messages: messages as unknown as InputJsonValue,
      },
    });
  } catch (error) {
    console.log(
      `Error saving messages with interview id ${analystInterviewId} and token ${interviewToken}`,
      error,
    );
  }
}

async function runInterview({
  analyst,
  persona,
  analystInterviewId,
  interviewToken,
  abortSignal,
  statReport,
}: Omit<ChatProps, "messages">) {
  const personaAgent: {
    messages: Message[];
  } = {
    messages: [{ id: generateId(), role: "user", content: interviewerPrologue(analyst) }],
  };

  const interviewer: {
    messages: Message[];
    terminated: boolean;
  } = {
    messages: [],
    terminated: false,
  };

  while (true) {
    try {
      const message = await chatWithPersona({
        messages: personaAgent.messages,
        persona,
        analyst,
        analystInterviewId,
        abortSignal,
        statReport,
      });
      // console.log(`\n[${analystInterviewId}] Persona:\n${message.content}\n`);
      personaAgent.messages.push({ ...message, role: "assistant" });
      interviewer.messages.push({ ...message, role: "user" });
    } catch (error) {
      console.log(`Error in Persona Agent: ${error}`);
      break;
    }

    await saveMessages({
      messages: personaAgent.messages,
      analystInterviewId,
      interviewToken,
    });

    try {
      const message = await chatWithInterviewer({
        messages: interviewer.messages,
        persona,
        analyst,
        analystInterviewId,
        interviewToken,
        abortSignal,
        statReport,
      });
      // console.log(`\n[${analystInterviewId}] Interviewer:\n${message.content}\n`);
      interviewer.messages.push({ ...message, role: "assistant" });
      personaAgent.messages.push({ ...message, role: "user" });
      if (message.content.includes("本次访谈结束，谢谢您的参与！")) {
        interviewer.terminated = true;
      }
    } catch (error) {
      console.log(`Error in Interviewer Agent: ${error}`);
      break;
    }

    await saveMessages({
      messages: personaAgent.messages,
      analystInterviewId,
      interviewToken,
    });

    if (interviewer.terminated) {
      break;
    }
  }
}

async function startInterview({
  analyst,
  persona,
  analystInterviewId,
  abortSignal,
  statReport,
}: {
  analyst: Analyst;
  persona: Persona;
  analystInterviewId: number;
  abortSignal: AbortSignal;
  statReport: StatReporter;
}) {
  const interviewToken = new Date().valueOf().toString();
  try {
    await prisma.analystInterview.update({
      where: { id: analystInterviewId },
      data: {
        personaPrompt: personaAgentSystem(persona),
        interviewerPrompt: interviewerSystem(analyst),
        messages: [],
        interviewToken,
      },
    });
  } catch (error) {
    console.log("Error saving prompts:", error);
  }

  await new Promise(async (resolve, reject) => {
    let stop = false;
    const start = Date.now();
    const tick = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - start) / 1000);
      if (elapsedSeconds > 600) {
        console.log(`\n[${analystInterviewId}] Interview timeout\n`);
        stop = true;
        reject(new Error("Interview timeout"));
      }
      if (stop) {
        console.log(`\n[${analystInterviewId}] Interview stopped\n`);
      } else {
        console.log(`\n[${analystInterviewId}] Interview is ongoing, ${elapsedSeconds} seconds`);
        setTimeout(() => tick(), 5000);
      }
    };
    tick();

    try {
      await runInterview({
        analyst,
        persona,
        analystInterviewId,
        interviewToken,
        abortSignal,
        statReport,
      });
      stop = true;
      resolve(null);
    } catch (error) {
      console.log(`[${analystInterviewId}] Interview run error:`, (error as Error).message);
      stop = true;
      reject(new Error(`[${analystInterviewId}] Interview run aborted`));
    }

    try {
      await prisma.analystInterview.update({
        where: { id: analystInterviewId, interviewToken },
        data: { interviewToken: null },
      });
    } catch (error) {
      console.log(
        `Error clearing interview token with interview id ${analystInterviewId} and token ${interviewToken}`,
        error,
      );
    }
  });
}
