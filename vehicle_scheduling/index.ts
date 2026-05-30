import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import repareRouter from "./routes/repair.route";
import { loggingMiddleware } from "./lib/loggingMiddleware";

const app = express();
const port = process.env.PORT as string;
app.use(cors());
app.use(express.json());
app.use(loggingMiddleware);
app.use("/api/v1", repareRouter);

app.listen(port, () => {
  console.log(`Server Running on port no : ${port}`);
});
