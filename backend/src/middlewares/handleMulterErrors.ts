import { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";

export function handleMulterErrors(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ code: "FILE_TOO_LARGE" });
    }
  }

  if (err.message === "UNSUPPORTED_MEDIA_TYPE") {
    return res.status(415).json({ code: "UNSUPPORTED_MEDIA_TYPE" });
  }

  next(err);
}

export function handleGeneralErrors(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Unhandled error:", err);
  res.status(500).json({ code: "INTERNAL" });
}
