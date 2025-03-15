"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Analyst, AnalystInterview, Persona } from "@/data";
import { Button } from "@/components/ui/button";
import { PlusIcon, UndoIcon } from "lucide-react";
import { PointAlertDialog } from "@/components/PointAlertDialog";
import { ReportDialog } from "./ReportDialog";
import { SelectPersonaDialog } from "./SelectPersonaDialog";
import { InterviewCard } from "./InterviewCard";
import Link from "next/link";

export function AnalystDetail({
  analyst: _analyst,
  interviews,
}: {
  analyst: Analyst;
  interviews: (AnalystInterview & { persona: Persona })[];
}) {
  const router = useRouter();

  const [analyst, setAnalyst] = useState(_analyst);
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Auto refresh when there are ongoing interviews
  useEffect(() => {
    const hasOngoingInterviews = interviews.some((i) => i.interviewToken);
    if (hasOngoingInterviews && !isRefreshing) {
      const timeoutId = setTimeout(() => {
        setIsRefreshing(true);
        router.refresh();
        setIsRefreshing(false);
      }, 10000);
      return () => clearTimeout(timeoutId);
    }
  }, [interviews, router, isRefreshing]);

  // Poll for report status when generating
  useEffect(() => {
    const checkReport = async () => {
      const response = await fetch(`/analyst/api?id=${analyst.id}`);
      const updatedAnalyst = await response.json();
      setAnalyst(updatedAnalyst);
    };
    const intervalId = setInterval(checkReport, 5000);
    return () => clearInterval(intervalId);
  }, [analyst.id]);

  const addPersona = () => {
    setIsOpen(true);
  };

  const generateReport = async () => {
    await clearReport();
    setIsReportOpen(true);
  };

  const clearReport = async () => {
    await fetch(`/analyst/api?id=${analyst.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...analyst,
        report: "",
      }),
    });
    setAnalyst({ ...analyst, report: "" });
  };

  const pointsDialog = useMemo(() => {
    const pendingCount = interviews.filter(
      (i) => !i.conclusion && !i.interviewToken,
    ).length;
    return (
      <PointAlertDialog
        points={pendingCount * 5}
        onConfirm={async () => {
          const pending = interviews.filter(
            (i) => !i.conclusion && !i.interviewToken,
          );
          for (const interview of pending) {
            await fetch("/interview/api/chat/background", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                analyst,
                persona: interview.persona,
                analystInterviewId: interview.id,
              }),
            });
          }
          router.refresh();
        }}
      >
        <Button variant="default" size="sm" disabled={pendingCount === 0}>
          开启所有人访谈 ({pendingCount})
        </Button>
      </PointAlertDialog>
    );
  }, [analyst, interviews, router]);

  return (
    <div className="mx-auto py-12 max-w-4xl space-y-8">
      <div className="relative w-full">
        <div className="absolute left-0">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            ← 返回
          </Button>
        </div>
        <h1 className="text-center text-xl font-medium mb-4">{analyst.role}</h1>
      </div>

      <div className="bg-accent/40 rounded-lg p-6 border">
        <div className="flex items-start gap-3">
          <div className="mt-1 rounded-md bg-background p-2 border">📝</div>
          <div className="flex-1">
            <div className="text-sm font-medium mb-2">研究主题</div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {analyst.topic}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              {analyst.report ? (
                <>
                  <Button asChild variant="default" size="sm">
                    <Link href={`/analyst/${analyst.id}/html`} target="_blank">
                      查看报告
                    </Link>
                  </Button>

                  <PointAlertDialog points={100} onConfirm={generateReport}>
                    <Button variant="outline" size="sm">
                      <UndoIcon /> 重新生成报告
                    </Button>
                  </PointAlertDialog>
                </>
              ) : (
                <PointAlertDialog points={100} onConfirm={generateReport}>
                  <Button variant="default" size="sm">
                    生成报告
                  </Button>
                </PointAlertDialog>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p>💡 你可以：</p>
        <ul className="list-disc ml-4 mt-1 space-y-1">
          <li>添加更多访谈对象来获取更全面的见解</li>
          <li>
            选择单个访谈逐一进行，或使用&quot;开启所有人访谈&quot;批量开始
          </li>
          <li>在访谈过程中随时生成报告，也可以在所有访谈结束后生成最终报告</li>
        </ul>
      </div>

      <div className="flex items-end justify-start space-y-4 mb-4">
        <h2 className="text-lg font-medium m-0">访谈用户</h2>
        <div className="ml-auto" />
        <div className="flex items-center justify-end gap-2">
          {pointsDialog}
          <Button variant="outline" size="sm" onClick={addPersona}>
            <PlusIcon /> 添加访谈对象
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {interviews.map((interview) => (
          <InterviewCard key={interview.id} interview={interview} />
        ))}
      </div>

      <SelectPersonaDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        analystId={analyst.id}
        onSuccess={() => router.refresh()}
      />
      <ReportDialog
        open={isReportOpen}
        onOpenChange={setIsReportOpen}
        src={`/analyst/${analyst.id}/live`}
      />
    </div>
  );
}
