import { redirect } from "next/navigation";

type SchedulePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SchedulePage({ searchParams }: SchedulePageProps) {
  const params = await searchParams;
  const next = new URLSearchParams();

  const view = params.view;
  const date = params.date;

  if (typeof view === "string") {
    next.set("view", view);
  } else {
    next.set("view", "month");
  }

  if (typeof date === "string") {
    if (view === "list") {
      next.set("listDate", date);
    } else {
      next.set("date", date);
    }
  }

  const query = next.toString();
  redirect(query ? `/trips?${query}` : "/trips?view=month");
}
