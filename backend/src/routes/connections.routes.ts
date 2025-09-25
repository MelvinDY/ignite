import { Router } from "express";
import jwt from "jsonwebtoken";
import {
  cancelConnectionRequest,
  listIncomingConnectionRequest,
  listOutgoingConnectionRequest,
} from "../services/connections.service";
import { ConnectionRequestError } from "../types/ConnectionRequest";

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

export default router;
