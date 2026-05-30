import { axiosInstance } from "./axiosInstance";

export const Log = async (
  stack: "backend" | "frontend",
  level: "debug" | "info" | "warn" | "error" | "fatal",
  packageName: string,
  message: string
) => {
  const token = process.env.TOKEN;
  if (!token) {
    return;
  }
  try {
    await axiosInstance.post(
      "/logs",
      {
        stack,
        level,
        package: packageName,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  } catch (error) {
    console.error(error);
  }
};
