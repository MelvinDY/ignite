import { Router } from "express";
import jwt from "jsonwebtoken";
import { cancelConnectionRequest, ConnectionRequestError, deleteConnection, getRelationshipStatus } from "../services/connections.service";
import { authenticateUser } from "./profile.routes";

const router = Router();

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
 * User Story: Remove a connection
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

export default router;