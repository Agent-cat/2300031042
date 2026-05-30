import expres from "express";
import { repair } from "../controllers/repair.controller";

const router = expres.Router();

router.get("/repair", repair);

export default router;
