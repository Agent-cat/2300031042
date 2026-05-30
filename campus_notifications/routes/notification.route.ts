import { Router } from "express";
import { authMiddleware } from "../lib/authMiddleware";
import { getPriorityInbox } from "../controllers/notification.controller";

const notificationRouter = Router();

notificationRouter.get("/notifications", authMiddleware, getPriorityInbox);

export default notificationRouter;
