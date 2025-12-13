import { LinguaFlowDB } from "@/db/dexie";
import { State } from "ts-fsrs";

export const exportRevlogToCSV = async (db: LinguaFlowDB): Promise<void> => {
  const revlogs = await db.revlog.toArray();

  const header = [
    "card_id",
    "review_time",
    "review_rating",
    "review_state",
    "review_duration",
  ].join(",");

  const rows = revlogs.map((log) => {
    const duration = 0;

    return [
      log.cid,
      log.id,
      log.ease,
      log.type,
      duration,
    ].join(",");
  });

  const csvContent = [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `revlog_${new Date().toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
