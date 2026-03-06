import { redirect } from "next/navigation";

export default function CompletedPage() {
  redirect("/dashboard?showCompleted=1");
}
