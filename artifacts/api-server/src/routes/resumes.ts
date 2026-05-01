import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db, resumesTable, resumeAnalysesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { analyzeResumeText } from "../lib/aiAnalyzer";
import { logger } from "../lib/logger";

const router = Router();

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

router.get("/resumes", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const resumes = await db
      .select({
        id: resumesTable.id,
        userId: resumesTable.userId,
        filename: resumesTable.filename,
        originalName: resumesTable.originalName,
        status: resumesTable.status,
        atsScore: resumesTable.atsScore,
        createdAt: resumesTable.createdAt,
        updatedAt: resumesTable.updatedAt,
      })
      .from(resumesTable)
      .where(eq(resumesTable.userId, userId))
      .orderBy(resumesTable.createdAt);

    res.json(resumes.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch resumes");
    res.status(500).json({ error: "Failed to fetch resumes" });
  }
});

router.post("/resumes/upload", upload.single("file"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    const pdfParse = (await import("pdf-parse")).default;
    let extractedText = "";
    try {
      const fileBuffer = fs.readFileSync(req.file.path);
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } catch (err) {
      logger.warn({ err }, "Failed to parse PDF text, continuing without extracted text");
    }

    const [resume] = await db
      .insert(resumesTable)
      .values({
        userId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        extractedText,
        status: "pending",
      })
      .returning();

    if (!resume) {
      res.status(500).json({ error: "Failed to create resume record" });
      return;
    }

    analyzeInBackground(resume.id, extractedText);

    res.json({
      id: resume.id,
      userId: resume.userId,
      filename: resume.filename,
      originalName: resume.originalName,
      status: resume.status,
      atsScore: resume.atsScore,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to upload resume");
    res.status(500).json({ error: "Failed to upload resume" });
  }
});

async function analyzeInBackground(resumeId: number, extractedText: string) {
  try {
    await db
      .update(resumesTable)
      .set({ status: "analyzing" })
      .where(eq(resumesTable.id, resumeId));

    const analysis = await analyzeResumeText(extractedText || "No text could be extracted from the PDF.");

    await db.insert(resumeAnalysesTable).values({
      resumeId,
      skills: analysis.skills,
      keywords: analysis.keywords,
      experienceJson: JSON.stringify(analysis.experience),
      improvementsJson: JSON.stringify(analysis.improvements),
      summary: analysis.summary,
      atsScore: analysis.atsScore,
    });

    await db
      .update(resumesTable)
      .set({ status: "completed", atsScore: analysis.atsScore })
      .where(eq(resumesTable.id, resumeId));
  } catch (err) {
    logger.error({ err, resumeId }, "Background analysis failed");
    await db
      .update(resumesTable)
      .set({ status: "failed" })
      .where(eq(resumesTable.id, resumeId));
  }
}

router.get("/resumes/:resumeId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const resumeId = Number(req.params.resumeId);
  if (isNaN(resumeId)) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, userId)));

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    const [analysisRow] = await db
      .select()
      .from(resumeAnalysesTable)
      .where(eq(resumeAnalysesTable.resumeId, resumeId));

    const resumeData = {
      id: resume.id,
      userId: resume.userId,
      filename: resume.filename,
      originalName: resume.originalName,
      status: resume.status,
      atsScore: resume.atsScore,
      createdAt: resume.createdAt.toISOString(),
      updatedAt: resume.updatedAt.toISOString(),
    };

    let analysis = null;
    if (analysisRow) {
      analysis = {
        id: analysisRow.id,
        resumeId: analysisRow.resumeId,
        skills: analysisRow.skills,
        experience: JSON.parse(analysisRow.experienceJson) as object[],
        keywords: analysisRow.keywords,
        atsScore: analysisRow.atsScore,
        improvements: JSON.parse(analysisRow.improvementsJson) as string[],
        summary: analysisRow.summary,
        createdAt: analysisRow.createdAt.toISOString(),
      };
    }

    res.json({ resume: resumeData, analysis });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch resume");
    res.status(500).json({ error: "Failed to fetch resume" });
  }
});

router.delete("/resumes/:resumeId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const resumeId = Number(req.params.resumeId);
  if (isNaN(resumeId)) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, userId)));

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    await db.delete(resumeAnalysesTable).where(eq(resumeAnalysesTable.resumeId, resumeId));
    await db.delete(resumesTable).where(eq(resumesTable.id, resumeId));

    const filePath = path.join(uploadDir, resume.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: "Resume deleted" });
  } catch (err) {
    req.log.error({ err }, "Failed to delete resume");
    res.status(500).json({ error: "Failed to delete resume" });
  }
});

router.post("/resumes/:resumeId/analyze", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const resumeId = Number(req.params.resumeId);
  if (isNaN(resumeId)) {
    res.status(400).json({ error: "Invalid resume ID" });
    return;
  }

  try {
    const [resume] = await db
      .select()
      .from(resumesTable)
      .where(and(eq(resumesTable.id, resumeId), eq(resumesTable.userId, userId)));

    if (!resume) {
      res.status(404).json({ error: "Resume not found" });
      return;
    }

    await db.delete(resumeAnalysesTable).where(eq(resumeAnalysesTable.resumeId, resumeId));

    analyzeInBackground(resumeId, resume.extractedText || "");

    res.json({
      id: 0,
      resumeId,
      skills: [],
      experience: [],
      keywords: [],
      atsScore: 0,
      improvements: [],
      summary: "Analysis in progress...",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to trigger analysis");
    res.status(500).json({ error: "Failed to trigger analysis" });
  }
});

export default router;
