import { CalendarApp } from "@/components/calendar-app";

export const dynamic = "force-dynamic";

export default function Page() {
  return <CalendarApp initialNow={new Date().toISOString()} />;
}
