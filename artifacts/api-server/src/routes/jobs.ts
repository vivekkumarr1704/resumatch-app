import { Router } from "express";
import { db, jobsTable, resumeAnalysesTable, resumesTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/jobs", async (req, res) => {
  try {
    const { search, category } = req.query as { search?: string; category?: string };
    let query = db.select().from(jobsTable);

    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(jobsTable.title, `%${search}%`),
          ilike(jobsTable.company, `%${search}%`),
          ilike(jobsTable.description, `%${search}%`),
        ),
      );
    }
    if (category) {
      conditions.push(eq(jobsTable.category, category));
    }

    const jobs = conditions.length > 0
      ? await db.select().from(jobsTable).where(and(...conditions))
      : await query;

    res.json(
      jobs.map((j) => ({
        ...j,
        postedAt: j.postedAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to fetch jobs");
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

router.get("/jobs/matches/:resumeId", async (req, res) => {
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

    const [analysis] = await db
      .select()
      .from(resumeAnalysesTable)
      .where(eq(resumeAnalysesTable.resumeId, resumeId));

    const resumeSkills = analysis?.skills?.map((s) => s.toLowerCase()) ?? [];

    const jobs = await db.select().from(jobsTable);

    const matches = jobs
      .map((job) => {
        const requiredSkills = job.requiredSkills.map((s) => s.toLowerCase());
        const matchedSkills = requiredSkills.filter((s) => resumeSkills.includes(s));
        const missingSkills = job.requiredSkills.filter(
          (s) => !resumeSkills.includes(s.toLowerCase()),
        );
        const matchPercentage =
          requiredSkills.length > 0
            ? Math.round((matchedSkills.length / requiredSkills.length) * 100)
            : 0;

        return {
          job: {
            ...job,
            postedAt: job.postedAt.toISOString(),
          },
          matchPercentage,
          matchedSkills: job.requiredSkills.filter((s) =>
            resumeSkills.includes(s.toLowerCase()),
          ),
          missingSkills,
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json(matches);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch job matches");
    res.status(500).json({ error: "Failed to fetch job matches" });
  }
});

router.get("/jobs/:jobId", async (req, res) => {
  const jobId = Number(req.params.jobId);
  if (isNaN(jobId)) {
    res.status(400).json({ error: "Invalid job ID" });
    return;
  }

  try {
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, jobId));

    if (!job) {
      res.status(404).json({ error: "Job not found" });
      return;
    }

    res.json({ ...job, postedAt: job.postedAt.toISOString() });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch job");
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

export default router;
