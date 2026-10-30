import type { Metadata } from "next";
import FutureEventsForm from "./future-events-form";

export const metadata: Metadata = {
  title: "Future Event Updates | South Haven Thriller Flash Mob",
  description: "Sign up to hear about future South Haven Thriller Flash Mob events.",
  robots: { index: false, follow: false },
};

export default function FutureEventsPage() {
  return <FutureEventsForm />;
}
