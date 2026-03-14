import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "TATTGWI — We sense what matters and build it into form",
  description:
    "Necessary things sensed and built into form. Web, Architecture, Data, Security, Game.",
};

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return <>{children}</>;
}
