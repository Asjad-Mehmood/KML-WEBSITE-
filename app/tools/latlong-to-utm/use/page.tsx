import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import UtmClient from "../UtmClient";

const SLUG = "latlong-to-utm";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <UtmClient />
    </ToolWorkspace>
  );
}
