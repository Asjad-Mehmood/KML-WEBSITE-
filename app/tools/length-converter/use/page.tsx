import ToolWorkspace from "../../../../components/tools/ToolWorkspace";
import { toolUseMetadata } from "@/lib/toolMeta";
import UnitConverter from "../../../../components/tools/UnitConverter";
import { LENGTH_UNITS } from "@/lib/toolMath";

const SLUG = "length-converter";
export const metadata = toolUseMetadata(SLUG);

export default function Page() {
  return (
    <ToolWorkspace slug={SLUG}>
      <UnitConverter units={LENGTH_UNITS} start="m" value="100" />
    </ToolWorkspace>
  );
}
