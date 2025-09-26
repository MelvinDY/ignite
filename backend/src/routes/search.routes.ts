import { Router } from "express";
import jwt from "jsonwebtoken";
import { listMajors, lookupCompanies, listWorkFields, listCities, searchDirectory } from "../services/search.service";

const router = Router();

router.get("/directory/search", async (req, res) => {
	const accessToken = req.headers.authorization?.split(" ")[1];
	if (!accessToken) return res.status(401).json({ code: "NOT_AUTHENTICATED" });
	try {
		jwt.verify(accessToken, process.env.JWT_SECRET!);
	} catch {
		return res.status(401).json({ code: "NOT_AUTHENTICATED" });
	}

	const q = String(req.query.q ?? "").trim();
	const majorsParam = String(req.query.major ?? "");
	const companiesParam = String(req.query.companies ?? "");
	const workFieldsParam = String(req.query.workFields ?? "");
	const citiesParam = String(req.query.cities ?? "");
	const citizenshipParam = String(req.query.citizenship ?? "");
	const sortBy = String(req.query.sortBy ?? "relevance");
	const page = Math.max(1, parseInt(String(req.query.page ?? "1"), 10) || 1);
	const pageSizeRaw = Math.min(100, parseInt(String(req.query.pageSize ?? "20"), 10) || 20);
	const pageSize = Math.max(1, pageSizeRaw);

	const splitList = (s: string) =>
		s.split(",").map(x => x.trim()).filter(Boolean);

	const cities = splitList(citiesParam);
	const citizenshipRaw = splitList(citizenshipParam).map(x => x.toLowerCase());
	const majors = splitList(majorsParam);
	const companies = splitList(companiesParam);
	const workFields = splitList(workFieldsParam);

	// Allow-list for citizenship (case-insensitive → enum casing)
	const toCitizenEnum = (v: string) =>
		v === "citizen" ? "Citizen" :
		v === "permanent resident" || v === "pr" ? "Permanent Resident" :
		null;
	const citizenship = Array.from(new Set(
		citizenshipRaw.map(toCitizenEnum).filter((x): x is "Citizen" | "Permanent Resident" => !!x)
	));

	// Validation: need at least one of q|cities|citizenship|more
	if (
		!q &&
		majors.length === 0 &&
		companies.length === 0 &&
		workFields.length === 0 &&
		cities.length === 0 &&
		citizenship.length === 0
	) {
		return res.status(400).json({ code: "VALIDATION_ERROR" });
	}

	try {
		const { results, total } = await searchDirectory({
			q,
			cities,
			citizenship,
			majors,
			companies,
			workFields,
			sortBy,
			page,
			pageSize,
		});

		return res.status(200).json({
		results,
		pagination: {
			total,
			page,
			pageSize,
			totalPages: Math.max(1, Math.ceil(total / pageSize)),
		},
		});
	} catch (err) {
		console.error("directory.search.error", err);
		return res.status(500).json({ code: "INTERNAL" });
	}
});

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
	if (!accessToken) {
		return res.status(401).json({ code: "NOT_AUTHENTICATED" });
	}

	try {
		jwt.verify(accessToken, process.env.JWT_SECRET!);
	} catch {
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

router.get("/lookup/cities", async (req, res) => {
	const accessToken = req.headers.authorization?.split(" ")[1];
	if (!accessToken) {
		return res.status(401).json({ code: "NOT_AUTHENTICATED" });
	}

	try {
		jwt.verify(accessToken, process.env.JWT_SECRET!);
	} catch {
		return res.status(401).json({ code: "NOT_AUTHENTICATED" });
	}

	// Parse isIndonesian parameter
	const isIndonesianParam = req.query.isIndonesian;
	let isIndonesian: boolean | undefined;
	if (isIndonesianParam === "true") {
		isIndonesian = true;
	} else if (isIndonesianParam === "false") {
		isIndonesian = false;
	}
	// undefined = show all cities

    try {
        const cities = await listCities(isIndonesian);
        return res.status(200).json(cities);
    } catch (err) {
        console.error("listCities.error", err);
        return res.status(500).json({ code: "INTERNAL" });
    }
});

export default router;