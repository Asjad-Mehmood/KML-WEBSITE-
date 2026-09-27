import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import MapClient from "../MapClient";

const SLUG = "coordinates-on-map";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <MapClient />
    </ToolWorkspace>
  );
}
