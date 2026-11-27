// Survey Toolkit: the questions on its page (/toolkit, and the home page when it shows the
// Toolkit). One list for the page and for its FAQ structured data, so the two always match.
export const TOOLKIT_FAQS: { q: string; a: string }[] = [
  { q: "Is it free?", a: "Yes. The Toolkit is free, like the tools it installs." },
  { q: "Do I need an account?", a: "Yes, your free SurveyX Digital account, the same one you use on this website and in the web apps." },
  {
    q: "I already have some of the tools. Will they be installed again?",
    a: "No. The Toolkit finds what is on your PC and only updates it when a new version comes out.",
  },
  { q: "What if a tool is open when an update arrives?", a: "Nothing happens to it. The update waits and installs once you close the tool." },
  { q: "Can I stop the automatic updates?", a: "Yes. Set any tool to Ask me, and it is only updated when you press Update." },
  { q: "Does it work offline?", a: "Your tools work as usual. The Toolkit shows what it knew at its last check and catches up when you are back online." },
  {
    q: "Windows says it protected my PC. Is the Toolkit safe?",
    a: "Yes. Windows SmartScreen shows that for new programs it hasn't seen often. Press More info, then Run anyway. Every tool the Toolkit installs is checked against its SHA-256 fingerprint first.",
  },
  { q: "How do I remove it?", a: "Windows Settings, Apps, Survey Toolkit, Uninstall. Your tools stay installed; the Toolkit's own settings and sign-in go with it." },
];

export const TOOLKIT_TITLE = "Survey Toolkit: every survey tool in one download";
export const TOOLKIT_DESCRIPTION =
  "One free Windows program installs Excel to KML, RoadPro, Traverse & Level, Project Folder Manager and Slope Calculator, and keeps every one of them up to date by itself.";
