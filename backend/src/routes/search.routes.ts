import { Router } from "express";
import jwt from "jsonwebtoken";
import { listMajors, lookupCompanies, listWorkFields } from "../services/search.service";

const router = Router();

router.get("/lookup/majors", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }

    try {
        jwt.verify(accessToken, process.env.JWT_SECRET!);
    } catch {
        return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }

    try {
        const majors = await listMajors();
        return res.status(200).json(majors);
    } catch (err) {
        console.error("listMajors.error", err);
        return res.status(500).json({ code: "INTERNAL" });
    }
});

router.get("/lookup/companies", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) return res.status(401).json({ code: "NOT_AUTHENTICATED" });

    try {
        jwt.verify(accessToken, process.env.JWT_SECRET!) as any;
    } catch (error) {
        return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }

    const q = String(req.query.q || "");
    try {
        const companies = await lookupCompanies(q);
        return res.status(200).json(companies);
    } catch (err) {
        console.error("lookup.companies.error", err);
        return res.status(500).json({ code: "INTERNAL" });
    }
});

router.get("/lookup/work-fields", async (req, res) => {
    const accessToken = req.headers.authorization?.split(" ")[1];
    if (!accessToken) {
        return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }
    
    try {
        jwt.verify(accessToken, process.env.JWT_SECRET!);
    } catch {
        return res.status(401).json({ code: "NOT_AUTHENTICATED" });
    }
    
    try {
        const workFields = await listWorkFields();
        return res.status(200).json(workFields);
    } catch (err) {
        console.error("listWorkFields.error", err);
        return res.status(500).json({ code: "INTERNAL" });
    }
});

export default router;