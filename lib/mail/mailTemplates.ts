// Admin → Email: ready-made emails we send often. Choosing one fills the subject, title, message
// and button, to change before sending. Every email starts "Hi {name}," by itself; {name} in the
// text is each person's first name. Links may be a path on this site (/toolkit) or a full address.
export type MailTemplate = {
  id: string;
  /** on the chip */
  label: string;
  /** under it: when to use it */
  hint: string;
  subject: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonUrl: string;
};

export const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "moved",
    label: "We've moved",
    hint: "The website is now surveyxdigital.com",
    subject: "Excel to KML is now SurveyX Digital",
    title: "We've moved to surveyxdigital.com",
    body: `Excel to KML has a new name and a new home: we're now SurveyX Digital, at www.surveyxdigital.com.

Nothing changes for you. Your account, your saved jobs and calculations, and every program are the same, and you sign in with the same email and password. Old links to exceltokml.com take you to the right page on the new site.

Programs you have installed keep working and keep updating by themselves. Their next versions show the new name.

Please add the new address to your bookmarks, and if our emails ever land in spam, mark this one as "not spam" so the next ones reach you.`,
    buttonLabel: "Visit surveyxdigital.com",
    buttonUrl: "/?from=exceltokml",
  },
  {
    id: "fixed",
    label: "A problem is fixed",
    hint: "After an error or an outage",
    subject: "The problem with … is fixed",
    title: "The problem is fixed",
    body: `Between … and …, … wasn't working as it should: … . We're sorry for the trouble.

It's fixed now. You don't need to do anything. If you saw an error then, please try again.

If something still doesn't look right, reply to this email or use Report a problem in the program, and we'll look at it straight away.`,
    buttonLabel: "",
    buttonUrl: "",
  },
  {
    id: "review",
    label: "Ask for a review",
    hint: "A star rating for the Survey Toolkit",
    subject: "How is the Survey Toolkit working for you?",
    title: "How is the Survey Toolkit working for you?",
    body: `You're using the Survey Toolkit to install and update your survey programs. Would you tell us how it's going?

A star rating takes ten seconds, and a sentence or two helps even more. It helps other surveyors find the Toolkit, and it shows us what to make better.

Something not working? Reply to this email instead: we'd rather fix it than read about it in a review.`,
    buttonLabel: "Rate the Survey Toolkit",
    buttonUrl: "/review/toolkit",
  },
  {
    id: "update",
    label: "New versions",
    hint: "Pick a release: filled from its notes",
    subject: "New versions of our survey programs",
    title: "What's new",
    body: `New versions of … are out:

… : …
… : …

Installed programs update by themselves the next time you open them while you're online. With the Survey Toolkit, every program updates from one place.`,
    buttonLabel: "See what's new",
    buttonUrl: "/whats-new",
  },
  {
    id: "maintenance",
    label: "Planned maintenance",
    hint: "Sign-in or saving paused for a while",
    subject: "Planned maintenance on …",
    title: "A short break on …",
    body: `On … from … to … (… time), the website will be down for maintenance. During that time you can't sign in or save to your account.

The programs on your computer keep working, and anything you save while they're offline is sent when the website is back.

We're sorry for the wait, and thank you for your patience.`,
    buttonLabel: "",
    buttonUrl: "",
  },
  {
    id: "missyou",
    label: "We miss you",
    hint: "To people not seen for a while (picks that group)",
    subject: "{name}, your survey tools are still here",
    title: "It's been a while",
    body: `We noticed you haven't been back for a while, so here's what you may have missed.

Excel to KML now puts survey points on any of 5,800+ grids into Google Earth, with photos, symbols and a report to hand in. Traverse & Level adjusts traverses and level books in the browser, and Slope Calculator works out slopes and levels along a line. They're all free, and one account works in all of them.

Your account, your saved jobs and your files are just as you left them.

If something didn't work for you, or a grid or feature was missing, just reply to this email and tell us. We read every reply and it often turns into the next update.`,
    buttonLabel: "Open my account",
    buttonUrl: "/dashboard",
  },
  {
    id: "blank",
    label: "Blank",
    hint: "Write your own",
    subject: "",
    title: "",
    body: "",
    buttonLabel: "",
    buttonUrl: "",
  },
];
