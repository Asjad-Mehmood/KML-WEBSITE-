import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/geo/toolMeta";
import DmsClient from "../DmsClient";

const SLUG = "dms-to-decimal";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <DmsClient />
    </ToolWorkspace>
  );
}
