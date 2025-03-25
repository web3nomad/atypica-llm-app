import LanguageToggle from "@/components/LanguageToggle";
import UserMenu from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { StudyHistoryDrawer } from "./HistoryDrawer";
import { InputSection } from "./InputSection";

export default function HomePageClient({ anonymous }: { anonymous: boolean }) {
  const t = useTranslations();
  return (
    <div className="min-h-screen max-w-6xl mx-auto py-12 sm:py-24 space-y-12 sm:space-y-24">
      <div className="text-center space-y-6">
        {/* <h1
          className={cn(
            "text-4xl sm:text-6xl font-mono font-light leading-tight tracking-wide bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-1000",
            "font-EuclidCircularA font-bold",
          )}
        >
          atypica.LLM
        </h1> */}
        <Image
          src="/_public/atypica.llm.svg"
          alt="atypica.LLM Logo"
          width={450}
          height={100}
          className="mt-20 sm:mt-10 block max-w-10/12 mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000"
        />
        <p
          className={cn(
            "text-base sm:text-xl font-light text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000",
          )}
        >
          {t("tagline")}
        </p>
      </div>
      <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 p-3">
        <InputSection />
      </div>
      {!anonymous ? (
        <div className="fixed left-2 top-2 sm:top-4 sm:left-4">
          <StudyHistoryDrawer />
        </div>
      ) : null}
      <div className="fixed right-2 top-2 sm:top-4 sm:right-4 flex items-center justify-end gap-4">
        <LanguageToggle />
        <UserMenu />
      </div>
    </div>
  );
}
