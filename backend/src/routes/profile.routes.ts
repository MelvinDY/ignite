import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import multer, { MulterError } from "multer";
import {
  AddEducationSchema,
  HandleSchema,
  UpdateProfileSchema,
  UpdateSocialLinksSchema,
  CreateExperienceSchema,
  UpdateExperienceSchema,
  UpdateEducationSchema,
} from "../validation/profile.schemas";
import {
  getProfileSkills,
  addSkillToProfile,
  removeSkillFromProfile,
} from "../services/skills.service";
import {
  isHandleAvailable,
  setHandle,
  getProfileDetails,
  getPublicProfileByHandle,
  uploadProfilePicture,
  uploadBannerImage,
  updateProfile,
  replaceSocialLinks,
  deleteProfilePicture,
  deleteBannerImage,
} from "../services/profile.service";
import { handleMulterErrors } from "../middlewares/handleMulterErrors";
import {
  addEducationToProfile,
  getProfileEducations,
  updateProfileEducation,
  deleteProfileEducation
} from "../services/educations.service";
import {
  getProfileExperiences,
  createExperience,
  updateExperience,
  deleteExperience
} from "../services/experiences.service";

const router = Router();

const authenticateUser: (req: Request, res: Response) => string | null = (req, res) => {
  // Check for valid token
  const accessToken = req.headers.authorization?.split(' ')[1];
  if (!accessToken) {
    res.status(401).json({ code: 'NOT_AUTHENTICATED' });
    return null;
  }
  try {
    // Extract user id from token
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    const userId = decoded?.sub;
    if (!userId) throw new Error('No userId in token');
    return userId;
  } catch {
    res.status(401).json({ code: 'NOT_AUTHENTICATED' });
    return null;
  }
};

// GET /profile/me - Get user profile details
router.get("/profile/me", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  try {
    const profileDetails = await getProfileDetails(userId);
    return res.status(200).json(profileDetails);
  } catch (err) {
    console.error("get-profile.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});


// PATCH /profile - Update user profile details
router.patch("/profile", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // Validate request body
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    await updateProfile(userId, parsed.data);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err?.code === "VALIDATION_ERROR") {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
    console.error("updateProfile.error", err);
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
  const userId = authenticateUser(req, res);
  if (!userId) return;

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
  const userId = authenticateUser(req, res);
  if (!userId) return;

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
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // Validate body
  const { skill } = req.body || {};
  if (!skill || typeof skill !== "string" || !skill.trim()) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      details: { skill: "Skill is required" },
    });
  }

  try {
    const result = await addSkillToProfile(userId, skill);
    return res
      .status(201)
      .json({ success: true, id: result.id, name: result.name });
  } catch (err: any) {
    if (err.code === "VALIDATION_ERROR") {
      return res
        .status(400)
        .json({ code: "VALIDATION_ERROR", details: err.details });
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
  const userId = authenticateUser(req, res);
  if (!userId) return;

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

/**
 * User Story 2.1 - POST /profile/picture
 * Uploads profile picture
 */

// Multer middleware
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (
    req: Express.Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    if (
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(new Error("UNSUPPORTED_MEDIA_TYPE"));
    }
  },
});

router.post(
  "/profile/picture",
  upload.single("profile_picture"),
  async (req, res) => {
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

    const picture = req.file;

    if (!picture) {
      return res.status(415).json({ code: "UNSUPPORTED_MEDIA_TYPE" });
    }

    try {
      const photoUrl = await uploadProfilePicture(userId, picture);
      return res.status(200).json({
        success: true,
        photoUrl: photoUrl,
      });
    } catch (err) {
      return res.status(500).json({ code: "INTERNAL" });
    }
  }
);

/**
 * User Story 2.3 - Remove Profile Picture
 */
router.delete("/profile/picture", async (req, res) => {
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
    await deleteProfilePicture(userId);

    return res.status(200).json({
      success: true,
    });
  } catch (err) {
    console.error("Delete profile picture error:", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// GET  /profile/educations - lists all profile educations
router.get("/profile/educations", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  try {
    const educations = await getProfileEducations(userId);
    return res.status(200).json(educations);
  } catch (err) {
    console.error("getProfileEducations.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User story 2.14 - Upload/ replace banner image
 */
router.post(
  "/profile/banner",
  upload.single("banner_image"),
  async (req, res) => {
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

    const banner = req.file;

    if (!banner) {
      return res.status(415).json({ code: "UNSUPPORTED_MEDIA_TYPE" });
    }

    try {
      const bannerUrl = await uploadBannerImage(userId, banner);
      return res.status(200).json({
        success: true,
        bannerUrl: bannerUrl,
      });
    } catch (err) {
      return res.status(500).json({ code: "INTERNAL" });
    }
  }
);

/**
 * User story 2.15 - Remove banner image
 */
router.delete("/profile/banner", async (req, res) => {
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

    await deleteBannerImage(userId);
    return res.status(200).json({
      success: true,
      message: "Banner image removed successfully",
    });
  } catch (err) {
    console.error("Delete banner error:", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.6 — PATCH /profile/social-links
router.patch("/profile/social-links", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // validate body
  const parsed = UpdateSocialLinksSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    await replaceSocialLinks(userId, parsed.data.socialLinks);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("profile.social-links.update.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// POST  /profile/educations - add an education for a profile
router.post("/profile/educations", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // Validate request body
  const parsed = AddEducationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      code: "VALIDATION_ERROR",
      details: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const educationId = await addEducationToProfile(userId, parsed.data);
    return res.status(201).json({ success: true, id: educationId });
  } catch (err: any) {
    if (err?.code === "VALIDATION_ERROR") {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
    console.error("addEducation.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.10 — GET /profile/experiences
router.get("/profile/experiences", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  try {
    const experiences = await getProfileExperiences(userId);
    return res.status(200).json(experiences);
  } catch (err) {
    console.error("getProfileExperiences.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.11 — POST /profile/experiences
router.post("/profile/experiences", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const parsed = CreateExperienceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    const id = await createExperience(userId, parsed.data);
    return res.status(201).json({ success: true, id });
  } catch (err) {
    console.error("profile.experiences.create.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.12 — PATCH /profile/experiences/:id
router.patch("/profile/experiences/:id", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const experienceId = String(req.params.id || "");
  if (!experienceId) return res.status(404).json({ code: "NOT_FOUND" });

  // Validate body (partial)
  const parsed = UpdateExperienceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    await updateExperience(userId, experienceId, parsed.data);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    if (err?.code === "VALIDATION_ERROR") {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
    console.error("update-experience.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// 2.13 — DELETE /profile/experiences/:id
router.delete('/profile/experiences/:id', async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const experienceId = String(req.params.id || '').trim();
  if (!experienceId) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }

  try {
    const result = await deleteExperience(userId, experienceId);

    if (result === 'NOT_OWNED') {
      return res.status(404).json({ code: 'NOT_FOUND' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('deleteExperience.error', err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

// PATCH /profile/educations/:id
router.patch("/profile/educations/:id", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const eduId = String(req.params.id || '').trim();
  if (!eduId) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }

  // Validate request body
  const parsed = UpdateEducationSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    await updateProfileEducation(userId, eduId, parsed.data);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    if (err?.code === "VALIDATION_ERROR") {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
    console.error("updateEducation.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// DELETE /profile/educations/:id
router.delete('/profile/educations/:id', async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const eduId = String(req.params.id || '').trim();
  if (!eduId) {
    return res.status(404).json({ code: 'NOT_FOUND' });
  }

  try {
    const result = await deleteProfileEducation(userId, eduId);

    if (result === 'NOT_OWNED') {
      return res.status(404).json({ code: 'NOT_FOUND' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('deleteEducation.error', err);
    return res.status(500).json({ code: 'INTERNAL' });
  }
});

// GET /profile/:handle/educations
router.get("/profile/:handle/educations", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;
  
  const { handle } = req.params;
  
  // Validate handle format
  const handleValidation = HandleSchema.safeParse({ handle });
  if (!handleValidation.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }
  
  try {
    const educations = await getProfileEducations(undefined, handle);
    return res.status(200).json(educations);
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    console.error("getProfileEducationsHandle.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

// GET /profile/:handle - Get profile by handle (requires authentication)
// This route must be LAST to avoid conflicts with specific routes like /profile/educations
router.get("/profile/:handle", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const { handle } = req.params;

  if (!handle) {
    return res.status(400).json({ code: "INVALID_HANDLE" });
  }

  try {
    const profileDetails = await getPublicProfileByHandle(handle);
    return res.status(200).json(profileDetails);
  } catch (err: any) {
    if (err?.code === "PROFILE_NOT_FOUND") {
      return res.status(404).json({ code: "PROFILE_NOT_FOUND", message: "Profile not found" });
    }
    console.error("get-profile.error", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

router.use(handleMulterErrors);

export default router;
