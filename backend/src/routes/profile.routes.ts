import { Router } from "express";
import jwt from "jsonwebtoken";
import { HandleSchema } from "../validation/profile.schemas";
import { getProfileSkills, addSkillToProfile, removeSkillFromProfile } from "../services/skills.service";
import {
  isHandleAvailable,
  setHandle,
  getProfileDetails,
} from "../services/profile.service";

const router = Router();

// GET /profile/me - Get user profile details
router.get("/profile/me", async (req, res) => {
  // Check for valid token
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }
  // Extract user id from token
  let userId: string;
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    userId = decoded.sub;
    if (!userId) throw new Error("No userId in token");
  } catch {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }
  try {
    const profileDetails = await getProfileDetails(userId);
    return res.status(200).json(profileDetails);
  } catch (err) {
    console.error("get-profile.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.7a — GET /handles/check?handle=xxx
router.get("/handles/check", async (req, res) => {
  const handle = String(req.query.handle || "");
  const parsed = HandleSchema.safeParse({ handle });
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }
  try {
    const available = await isHandleAvailable(parsed.data.handle);
    return res.status(200).json({ available });
  } catch (err) {
    console.error("handles.check.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.7 — PATCH /profile/handle
router.patch("/profile/handle", async (req, res) => {
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ code: "NOT_AUTHENTICATED" });

  let userId: string;
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    userId = decoded.sub;
    if (!userId) throw new Error("No userId in token");
  } catch {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }

  const parsed = HandleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    const newHandle = await setHandle(userId, parsed.data.handle);
    return res.status(200).json({ success: true, handle: newHandle });
  } catch (err: any) {
    if (err?.code === "HANDLE_TAKEN") {
      return res.status(409).json({ code: "HANDLE_TAKEN" });
    }
    console.error("setHandle.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

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

// POST /profile/skills - Add a skill to the user's profile
router.post("/profile/skills", async (req, res) => {
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

  // Validate body
  const { skill } = req.body || {};
  if (!skill || typeof skill !== "string" || !skill.trim()) {
    return res.status(400).json({ code: "VALIDATION_ERROR", details: { skill: "Skill is required" } });
  }

  try {
    const result = await addSkillToProfile(userId, skill);
    return res.status(201).json({ success: true, id: result.id, name: result.name });
  } catch (err: any) {
    if (err.code === "VALIDATION_ERROR") {
      return res.status(400).json({ code: "VALIDATION_ERROR", details: err.details });
    }
    if (err.code === "NOT_AUTHENTICATED") {
      return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }
    console.error("addSkillToProfile.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// DELETE /profile/skills/:id - Remove a skill from the user's profile
router.delete("/profile/skills/:id", async (req, res) => {
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
  
  const skillId = Number(req.params.id);
  if (!skillId || isNaN(skillId)) {
    return res.status(404).json({ code: "NOT_FOUND" });
  }
  
  try {
    // Returns true if deleted, false if not found/not owned
    const deleted = await removeSkillFromProfile(userId, skillId);
    if (!deleted) {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err.code === "NOT_AUTHENTICATED") {
      return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }
    console.error("removeSkillFromProfile.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

export default router;
