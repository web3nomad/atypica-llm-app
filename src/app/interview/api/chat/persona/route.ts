import { Message, streamText } from "ai";
import tools from "@/tools/tools";
import { Persona } from "@/data";
import { prisma } from "@/lib/prisma";
import { personaAgentSystem } from "@/prompt";
import openai from "@/lib/openai";

export async function POST(req: Request) {
  const { messages, persona, analystInterviewId } = (await req.json()) as {
    messages: Message[];
    persona: Persona;
    analystInterviewId: number;
  };

  const systemPrompt = personaAgentSystem(persona);

  try {
    await prisma.analystInterview.update({
      where: { id: analystInterviewId },
      data: {
        personaPrompt: systemPrompt,
      },
    });
  } catch (error) {
    console.error("Error saving personaPrompt:", error);
  }

  const result = streamText({
    model: openai("gpt-4o"),
    // model: openai("claude-3-7-sonnet"),
    system: systemPrompt,
    messages, // useChat 和 api 通信的时候，自己维护的这个 messages 会在每次请求的时候去掉 id
    tools: {
      xhsSearch: tools.xhsSearch,
    },
    maxSteps: 2,
    onError: async (error) => {
      console.error("Error occurred:", error);
    },
    // 这里保存有问题，有时候 tool 的 result 是 experimental_toToolResultContent 的结果，没有 tool 返回的结果
    // 研究了一下是这样，message.content 是有 type 的，一种 type 是 tool 结果的文本序列化给模型看的，但是不体现在 assistant 回复的 content 中，这类文本需要忽略
    // onFinish: async (response) => {
    //   const finalMessages = appendResponseMessages({
    //     messages,
    //     responseMessages: response.response.messages,
    //   });
    //   await updateAnalystInterview(
    //     analystInterviewId,
    //     systemPrompt,
    //     finalMessages,
    //   );
    // },
  });

  return result.toDataStreamResponse();
}
