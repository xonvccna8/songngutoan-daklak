import type { Metadata } from "next";

export const metadata: Metadata = { title: "Học sinh" };

export default function StudentLayout({ children }: LayoutProps<"/s">) {
  return children;
}
