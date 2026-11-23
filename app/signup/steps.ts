// The sign-up's steps (app/signup/[step]); shared by its server page and its client flow
export const SIGNUP_STEPS = ["details", "password", "about"] as const;
export type SignupStepName = (typeof SIGNUP_STEPS)[number];
