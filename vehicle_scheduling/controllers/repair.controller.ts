import type { Request, Response } from "express";
import { axiosInstance } from "../lib/axiosInstance";
import { Log } from "../lib/logger";

interface Depot {
  ID: number;
  MechanicHours: number;
}

interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

export const repair = async (req: Request, res: Response) => {
  const token = process.env.TOKEN;
  if (!token) {
    await Log("backend", "error", "auth", "token is not defined");
    return res.status(401).json({ error: "token is not defined" });
  }

  await Log("backend", "info", "controller", "Initiating repair scheduling calculation");

  try {
    await Log("backend", "info", "service", "Fetching depots data");
    const depotsRes = await axiosInstance.get<{ depots: Depot[] }>("/depots", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await Log("backend", "info", "service", "Fetching vehicles data");
    const vehiclesRes = await axiosInstance.get<{ vehicles: Vehicle[] }>("/vehicles", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const depots = depotsRes.data.depots;
    const vehicles = vehiclesRes.data.vehicles;

    await Log("backend", "info", "service", `Successfully fetched ${depots.length} depots and ${vehicles.length} vehicles`);

    const response = depots.map((depot) => {
      const W = depot.MechanicHours;
      const n = vehicles.length;
      const dp = new Array(W + 1).fill(0);
      const keep = Array.from({ length: n }, () => new Array(W + 1).fill(false));

      for (let i = 0; i < n; i++) {
        const vehicle = vehicles[i];
        if (!vehicle) continue;
        const weight = vehicle.Duration;
        const value = vehicle.Impact;
        for (let j = W; j >= weight; j--) {
          if (dp[j - weight] + value > dp[j]) {
            dp[j] = dp[j - weight] + value;
            keep[i]![j] = true;
          }
        }
      }

      const selectedVehicles: Vehicle[] = [];
      let tempW = W;
      for (let i = n - 1; i >= 0; i--) {
        const vehicle = vehicles[i];
        if (!vehicle) continue;
        if (keep[i]![tempW]) {
          selectedVehicles.push(vehicle);
          tempW -= vehicle.Duration;
        }
      }

      selectedVehicles.reverse();

      const totalDuration = selectedVehicles.reduce((sum, v) => sum + v.Duration, 0);
      const totalImpact = selectedVehicles.reduce((sum, v) => sum + v.Impact, 0);

      return {
        depotId: depot.ID,
        mechanicHours: depot.MechanicHours,
        totalDuration,
        totalImpact,
        vehicles: selectedVehicles,
      };
    });

    await Log("backend", "info", "controller", "Scheduling calculation completed successfully");
    res.status(200).json(response);
  } catch (error: any) {
    const errorMsg = error?.message || "Internal Server Error";
    await Log("backend", "error", "handler", `Scheduling failed: ${errorMsg}`);
    res.status(500).json({
      error: errorMsg,
      response: error?.response?.data
    });
  }
};
