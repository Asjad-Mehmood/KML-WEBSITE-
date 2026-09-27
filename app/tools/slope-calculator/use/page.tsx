import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import SlopeClient from "../SlopeClient";

const SLUG = "slope-calculator";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <SlopeClient />
    </ToolWorkspace>
  );
}
