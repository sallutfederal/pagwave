export type Tone = "success" | "warning" | "danger" | "accent" | "neutral";

const toneByStatus: Record<string, Tone> = {
  // sales
  Success: "success",
  Process: "warning",
  Failed: "danger",
  // transactions
  Completed: "success",
  Pending: "warning",
  // products
  Active: "success",
  Paused: "warning",
  // customers
  Blocked: "danger",
  // plans
  Free: "neutral",
  Plus: "accent",
  Enterprise: "neutral",
};

export function statusTone(status: string): Tone {
  return toneByStatus[status] ?? "neutral";
}