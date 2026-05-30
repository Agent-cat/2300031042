import type { Request, Response } from "express";
import { axiosInstance } from "../lib/axiosInstance";
import { Log } from "../lib/logger";

interface RawNotification {
  ID: string;
  Type: "Placement" | "Result" | "Event" | string;
  Message: string;
  Timestamp: string;
}

interface ScoredNotification extends RawNotification {
  score: number;
}

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function computeScore(notification: RawNotification): number {
  const typeWeight = TYPE_WEIGHT[notification.Type] ?? 0;
  const ageMs = Date.now() - new Date(notification.Timestamp).getTime();
  const recencyScore = 1 / (1 + ageMs / 1_000_000);
  return typeWeight + recencyScore;
}

function pickTopN(notifications: RawNotification[], n: number): ScoredNotification[] {
  return notifications
    .map((notif) => ({ ...notif, score: computeScore(notif) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export const getPriorityInbox = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = process.env.TOKEN as string;
    const n = parseInt((req.query.n as string) ?? "10", 10);
    const topN = Number.isFinite(n) && n > 0 ? n : 10;

    const { data } = await axiosInstance.get<{ notifications: RawNotification[] }>(
      "/notifications",
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const prioritized = pickTopN(data.notifications, topN);

    await Log("backend", "info", "notification", `Returning top ${topN} priority notifications`);

    res.status(200).json({
      count: prioritized.length,
      notifications: prioritized,
    });
  } catch (err: unknown) {
    res.status(500).json({
      error: (err as Error).message,
      stack: (err as Error).stack,
    });
  }
};
