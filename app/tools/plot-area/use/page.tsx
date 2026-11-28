import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/geo/toolMeta";
import PlotClient from "../PlotClient";

const SLUG = "plot-area";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <PlotClient />
    </ToolWorkspace>
  );
}
