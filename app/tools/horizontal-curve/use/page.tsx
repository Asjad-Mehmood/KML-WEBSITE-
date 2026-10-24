import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import CurveClient from "../CurveClient";

const SLUG = "horizontal-curve";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <CurveClient />
    </ToolWorkspace>
  );
}
