import ToolLanding from "../../../components/tools/ToolLanding";
import { toolMetadata } from "@/lib/toolMeta";

const SLUG = "slope-calculator";
export const metadata = toolMetadata(SLUG);

export default function Page() {
  return (
    <ToolLanding
      slug={SLUG}
      notes={
        <>
          <h2>Three ways to write the same slope</h2>
          <ul>
            <li><strong>Percent (grade):</strong> rise ÷ run × 100. A 1 m rise over 50 m is 2%. Used for roads, drains and pipes.</li>
            <li><strong>Degrees:</strong> the angle from level, arctan(rise ÷ run). 45° is 100%.</li>
            <li><strong>1 in N:</strong> how far you go along for each unit up. 2% is 1 in 50. Used for ramps and falls.</li>
          </ul>
          <h2>Typical values</h2>
          <ul>
            <li>Wheelchair ramp: no steeper than 1 in 12 (8.3%) in most codes, 1 in 20 (5%) preferred.</li>
            <li>Foul drain, 100 mm pipe: about 1 in 40 to 1 in 80 (2.5% to 1.25%).</li>
            <li>Road crossfall: about 2.5%.</li>
          </ul>
          <p>Always check the code or specification for your job; these are only rough guides.</p>
        </>
      }
    />
  );
}
