import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import TraverseClient from "../TraverseClient";

const SLUG = "traverse-adjustment";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <TraverseClient />
    </ToolWorkspace>
  );
}
