import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import {
  sendConnectionRequest,
  listIncomingConnectionRequest,
  listOutgoingConnectionRequest,
  getRelationshipStatus,
  deleteConnection,
  cancelConnectionRequest,
  getConnections,
} from "../services/connections.service";
import { ConnectionRequestError } from "../types/ConnectionRequest";
import { blockUser } from "../services/block.service";
import { authenticateUser } from "./profile.routes";

const router = Router();

/**
 * User Story 4.1 – Send Connection Request
 * POST /connections/requests
 * Auth: Bearer token
 * Body: { toProfileId: string, message?: string }
 * 201 -> { success:true, requestId, status:'pending' }
 */
const Body = z.object({
  toProfileId: z.string().uuid(),
  message: z.string().max(300).optional(),
});

router.post("/connections/requests", async (req, res) => {
  // 1) Auth
  const accessToken = req.headers.authorization?.split(" ")[1];
  if (!accessToken) return res.status(401).json({ code: "NOT_AUTHENTICATED" });

  let profileId: string;
  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    profileId = decoded.sub;
    if (!profileId) throw new Error("No profileId in token");
  } catch {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }

  // 2) Validate
  const parsed = Body.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  const { toProfileId, message } = parsed.data;

  // 3) Execute
  try {
    const { requestId } = await sendConnectionRequest({
      senderId: profileId,
      receiverId: toProfileId,
      message: message ?? null,
    });
    return res.status(201).json({ success: true, requestId, status: "pending" });
  } catch (err) {
    if (err instanceof ConnectionRequestError) {
      return res.status(err.statusCode).json({ code: err.code });
    }
    console.error("send connection request error:", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Story: Get current connections for networking
 * GET /connections?page=1&pageSize=20
 * 
 * As a logged-in user, I want to see my current connections for networking.
 * 
 * Auth: Bearer token required
 * Response (200): { results: [...], pagination: {...} }
 * 
 * Validation & Logic:
 * - Paginated, sort by connected_at DESC
 * 
 * Errors:
 * - 401 { code: NOT_AUTHENTICATED }
 */
router.get("/connections", async (req, res) => {
  // 1. Authenticate user
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

  // 2. Parse pagination parameters
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  try {
    // 3. Get connections using the service
    const result = await getConnections(userId, page, pageSize);
    return res.status(200).json(result);
  } catch (err) {
    console.error("get connections error:", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Story: Cancel a pending connection request
 * POST /connections/requests/:id/cancel
 *
 * As a sender, I want to withdraw a pending request.
 *
 * Auth: Bearer token required
 * Response (200): { "success": true }
 *
 * Validation & Logic:
 * - Must be pending and owned by the caller as sender
 * - Idempotent
 *
 * Errors:
 * - 401 { code: NOT_AUTHENTICATED }
 * - 404 { code: NOT_FOUND }
 * - 409 { code: INVALID_STATE }
 */
router.post("/connections/requests/:id/cancel", async (req, res) => {
  // 1. Authenticate user
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // 2. Get request ID from params
  const requestId = req.params.id;
  if (!requestId) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    // 3. Cancel the connection request using the service
    const result = await cancelConnectionRequest(requestId, userId);
    return res.status(200).json({ success: true });
  } catch (err) {
    // Handle service errors
    if (err instanceof ConnectionRequestError) {
      return res.status(err.statusCode).json({ code: err.code });
    }

    console.error("cancel connection request error:", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * User Story 4.2: Listing connection requests
 */
router.get("/connections/requests", async (req, res) => {
  const type = req.query.type ? req.query.type as string : "incoming";
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const accessToken = req.headers.authorization?.split(" ")[1];

  let userId: string;

  if (!accessToken) {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }

  try {
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET!);
    userId = decoded.sub as string;
    if (!userId) {
      throw new Error("No userId in token");
    }
  } catch (err) {
    return res.status(401).json({ code: "NOT_AUTHENTICATED" });
  }

  let data;

  if (type == "incoming") {
    data = await listIncomingConnectionRequest(userId, page, pageSize);
  } else if (type == "outgoing") {
    data = await listOutgoingConnectionRequest(userId, page, pageSize);
  }

  return res.status(200).json(data);
});

/** User Story: Remove a connection
 * DELETE /connections/:profileId
 * 
 * As a logged-in user, I want to remove a connection.
 * 
 * Auth: Bearer token required
 * Response (200): { "success": true }
 * 
 * Validation & Logic:
 * - A connection between me and :profileId must exist.
 * - Delete the connections row (undirected).
 * - Idempotent: deleting a non-existing connection still 200.
 * 
 * Errors:
 * - 401 { code: NOT_AUTHENTICATED }
 */
router.delete("/connections/:profileId", async (req, res) => {
  // 1. Authenticate user
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // 2. Get profile ID from params
  const targetProfileId = req.params.profileId;
  if (!targetProfileId) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    // 3. Delete the connection using the service
    const result = await deleteConnection(userId, targetProfileId);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("delete connection error:", err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * Story 4.8 — Get Relationship Status (helper)
 * GET /connections/status?withProfileId=xxx
 */
router.get("/connections/status", async (req, res) => {
  const userId = authenticateUser(req, res);
  if (!userId) return;

  const withProfileId = String(req.query.withProfileId || "").trim();
  if (!withProfileId) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  // no request to self
  if (withProfileId === userId) {
    return res.status(200).json({
      connected: false,
      pendingOutgoing: false,
      pendingIncoming: false,
      blockedByMe: false,
      blockedMe: false,
      canSendRequest: false,
    });
  }

  try {
    const status = await getRelationshipStatus(userId, withProfileId);
    return res.status(200).json(status);
  } catch (err: any) {
    if (err?.code === "NOT_FOUND") {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    console.error("connections.status.error", err?.message || err);
    return res.status(500).json({ code: "INTERNAL" });
  }
});

/**
 * Story 4.9 — Block user
 * POST /users/:profileId/block
 */
router.post("/users/:profileId/block", async (req, res) => {
  // Authenticate user
  const userId = authenticateUser(req, res);
  if (!userId) return;

  // Get profile ID (target blocked user) from params
  const targetProfileId = req.params.profileId;
  if (!targetProfileId) {
    return res.status(400).json({ code: "VALIDATION_ERROR" });
  }

  try {
    await blockUser(userId, targetProfileId);
    return res.status(200).json({ success: true });
  } catch (err: any) {
    if (err?.code === "VALIDATION_ERROR") {
      return res.status(400).json({ code: "VALIDATION_ERROR" });
    }
    if (err?.code === "NOT_FOUND") {
      return res.status(404).json({ code: "NOT_FOUND" });
    }
    return res.status(500).json({ code: "INTERNAL" });
  }
});

export default router;
