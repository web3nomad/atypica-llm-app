import { AnalystsList } from "./AnalystsList";
import { fetchAnalysts } from "@/data";

export default async function AnalystsPage() {
  const analysts = await fetchAnalysts();
  return <AnalystsList analysts={analysts} />;
}