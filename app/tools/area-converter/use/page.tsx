import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import UnitConverter from "../../../../components/tools/UnitConverter";
import { AREA_UNITS } from "@/lib/toolMath";

const SLUG = "area-converter";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <UnitConverter units={AREA_UNITS} start="kanal" value="1" />
    </ToolWorkspace>
  );
}
