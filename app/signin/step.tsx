import { redirect } from "next/navigation";
import { nextFromContinue, signinQuery, stateIsGood } from "@/lib/auth/signinFlow";
import SigninFlow from "./SigninFlow";
import SignupFlow from "../signup/SignupFlow";
import type { SignupStepName } from "../signup/steps";

type Params = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

/**
 * A step of the two-step sign-in. Its link must carry a good state for its continue address
 * (lib/signinFlow); otherwise the sign-in starts again with a fresh one.
 */
export async function SigninStep({ step, searchParams }: { step: "identifier" | "password"; searchParams: Params }) {
  const q = await searchParams;
  const cont = one(q.continue);
  const next = nextFromContinue(cont);
  const error = one(q.error);
  if (!cont || one(q.flow) !== "web" || !stateIsGood(one(q.state), cont)) {
    redirect(`/signin/identifier?${signinQuery(next, error)}`);
  }
  const query = new URLSearchParams({ continue: cont, flow: "web", state: one(q.state) as string }).toString();
  return <SigninFlow step={step} next={next} query={query} error={error} />;
}

/** A step of the sign-up (app/signup), with the same check of its link */
export async function SignupStep({ step, searchParams }: { step: SignupStepName; searchParams: Params }) {
  const q = await searchParams;
  const cont = one(q.continue);
  const next = nextFromContinue(cont);
  if (!cont || one(q.flow) !== "web" || !stateIsGood(one(q.state), cont)) {
    redirect(`/signup/details?${signinQuery(next, one(q.error))}`);
  }
  const query = new URLSearchParams({ continue: cont, flow: "web", state: one(q.state) as string }).toString();
  return <SignupFlow step={step} next={next} query={query} error={one(q.error)} />;
}
