"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessage } from "@/components/Message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import { Analyst, Persona } from "@/data";
import { Markdown } from "@/components/markdown";
import { AnalystInterview } from "@/data";
import { generateId } from "ai";
// import imageUrl from "./image";

export function Interview({
  analystInterview,
  analyst,
  persona,
}: {
  analystInterview: AnalystInterview;
  analyst: Analyst;
  persona: Persona;
}) {
  const [stop, setStop] = useState<"initial" | "talking" | "terminated">(
    "initial",
  );

  const personaAgentRef = useRef<ReturnType<typeof useChat>>(null);
  const interviewerRef = useRef<ReturnType<typeof useChat>>(null);

  const interviewer = useChat({
    maxSteps: 5,
    api: "/analyst/api/chat/interviewer",
    body: {
      analyst,
      analystInterviewId: analystInterview.id,
    },
    // 这个回调函数会在 useChat 里面被保存状态，这里不一定可以读到当前组件最新的状态，所以这个方法里最好只处理 message 和 options 值
    onFinish: (message, options) => {
      if (options.finishReason === "stop") {
        if (!message.content.includes("本次访谈结束，谢谢您的参与！")) {
          personaAgentRef.current?.append({
            role: "user",
            content: message.content,
          });
        }
      }
    },
  });

  interviewerRef.current = interviewer;

  const personaAgent = useChat({
    maxSteps: 5,
    api: "/analyst/api/chat/persona",
    body: {
      persona,
      analystInterviewId: analystInterview.id,
    },
    onFinish: (message, options) => {
      if (options.finishReason === "stop") {
        interviewerRef.current?.append(
          {
            role: "user",
            content: message.content,
          },
          // 第一条消息带上创意方案
          // interviewer.messages.length === 0 ? { experimental_attachments: [{ name: "AUX 空调宣传方案.jpg", contentType: "image/jpeg", url: imageUrl }] } : {},
        );
      }
    },
    initialMessages: useMemo(
      () =>
        analystInterview.messages.map((message) => ({
          id: generateId(),
          role: message.role,
          content: message.content,
        })),
      [analystInterview.messages],
    ),
  });

  personaAgentRef.current = personaAgent;

  const startConversation = useCallback(() => {
    setStop("talking");
    personaAgent.append(
      {
        role: "user",
        content: `你好，我是${analyst.role}，今天我想和您进行一次访谈，主题是：\n${analyst.topic}\n\n访谈开始之前，请您先自我介绍一下。`,
      },
      // { experimental_attachments: [{ name: "AUX 空调宣传方案.jpg", contentType: "image/jpeg", url: imageUrl }] },
    );
  }, [personaAgent, analyst]);

  const restartConversation = useCallback(() => {
    setStop("talking");
    personaAgent.setMessages([]);
    personaAgent.append({
      role: "user",
      content: `你好，我是${analyst.role}，今天我想和您进行一次访谈，主题是：\n${analyst.topic}\n\n访谈开始之前，请您先自我介绍一下。`,
    });
  }, [personaAgent, analyst]);

  const stopConversation = useCallback(() => {
    setStop("terminated");
    personaAgent.stop();
    interviewer.stop();
  }, [personaAgent, interviewer]);

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex flex-row justify-center pb-20 h-dvh bg-white dark:bg-zinc-900">
      <div className="text-xs w-[400px] m-10 h-full overflow-y-scroll">
        <Markdown>{analystInterview.conclusion}</Markdown>
      </div>
      <div className="flex flex-col justify-between gap-4 w-[1200px] h-full">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-6 h-full w-full items-center overflow-y-scroll"
        >
          {personaAgent.messages.map((message) => (
            <ChatMessage
              key={`message-${message.id}`}
              nickname={message.role === "assistant" ? "用户" : "品牌"}
              role={message.role}
              content={message.content}
              parts={message.parts}
            ></ChatMessage>
          ))}
          {personaAgent.status === "ready" &&
            (interviewer.status === "streaming" ||
              interviewer.status === "ready") &&
            interviewer.messages
              .filter((m) => m.role === "assistant")
              .slice(-1)
              .map((interviewerMessage) => (
                <ChatMessage
                  key={`pending-${interviewerMessage.id}`}
                  nickname={"品牌正在准备问题"}
                  role={interviewerMessage.role}
                  content={interviewerMessage.content}
                  parts={interviewerMessage.parts}
                ></ChatMessage>
              ))}
          {personaAgent.error && (
            <div className="flex justify-center items-center text-red-500 dark:text-red-400 text-sm">
              {personaAgent.error.toString()}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex justify-center items-center text-zinc-500 dark:text-zinc-400 text-sm">
          user is {personaAgent.status}, interviewer is {interviewer.status}
        </div>

        <div className="flex justify-center items-center">
          {stop === "initial" ? (
            personaAgent.messages.length === 0 ? (
              <button
                onClick={startConversation}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                开始会话
              </button>
            ) : (
              <button
                onClick={restartConversation}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                重新开始会话
              </button>
            )
          ) : stop === "talking" ? (
            <button
              onClick={stopConversation}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              结束会话
            </button>
          ) : (
            <div>会话结束</div>
          )}
        </div>
      </div>
    </div>
  );
}
