import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import DistanceClient from "../DistanceClient";

const SLUG = "distance-bearing";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <DistanceClient />
    </ToolWorkspace>
  );
}
