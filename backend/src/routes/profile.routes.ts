import { Router } from "express";
import jwt from "jsonwebtoken";
import { getProfileSkills } from "../services/skills.service";

const router = Router();

router.get("/profile/skills", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }
  let userId: string;
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    userId = decoded.sub;
    if (!userId) throw new Error("No userId in token");
  } catch {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }
  try {
    const skills = await getProfileSkills(userId);
    return res.status(200).json(skills);
  } catch (err) {
    console.error("getProfileSkills.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

export default router;
