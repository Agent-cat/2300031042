import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import { loggingMiddleware } from "./lib/loggingMiddleware";
import notificationRouter from "./routes/notification.route";

const app = express();
const port = process.env.PORT as string;

app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);

app.use("/api/v1", notificationRouter);

app.listen(port, () => {
  console.log(`Server Running on port no : ${port}`);
});
