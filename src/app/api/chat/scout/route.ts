import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import tools from "@/tools";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    // model: openai("o3-mini"),
    model: openai("claude-3-7-sonnet"),
    system:
      "你的任务是利用提供的工具寻找符合要求的人设。开始之前，请先咨询专家意见。在寻找过程中，要不断思考并反思，大胆推翻之前的假设 - 这种思维方式值得鼓励。请记住要结合专家意见和搜索结果，反复验证和调整你的判断。",
    messages,
    tools,
    maxSteps: 2,
    onError: async (error) => {
      console.error("Error occurred:", error);
    },
  });

  return result.toDataStreamResponse();
}
