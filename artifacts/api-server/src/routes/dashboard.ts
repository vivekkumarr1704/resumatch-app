import { Router } from "express";
import { db, resumesTable, resumeAnalysesTable } from "@workspace/db";
import { eq, avg, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const resumes = await db
      .select()
      .from(resumesTable)
      .where(eq(resumesTable.userId, userId))
      .orderBy(desc(resumesTable.createdAt));

    const totalResumes = resumes.length;

    const completedResumes = resumes.filter((r) => r.status === "completed");
    const averageAtsScore =
      completedResumes.length > 0
        ? Math.round(
            completedResumes.reduce((sum, r) => sum + (r.atsScore ?? 0), 0) /
              completedResumes.length,
          )
        : null;

    const bestJobMatchScore =
      completedResumes.length > 0
        ? Math.max(...completedResumes.map((r) => r.atsScore ?? 0))
        : null;

    const resumeIds = resumes.map((r) => r.id);
    const allSkills: string[] = [];

    if (resumeIds.length > 0) {
      for (const resumeId of resumeIds) {
        const [analysis] = await db
          .select({ skills: resumeAnalysesTable.skills })
          .from(resumeAnalysesTable)
          .where(eq(resumeAnalysesTable.resumeId, resumeId));
        if (analysis?.skills) {
          allSkills.push(...analysis.skills);
        }
      }
    }

    const skillCounts: Record<string, number> = {};
    for (const skill of allSkills) {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    }
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill]) => skill);

    const recentResumes = resumes.slice(0, 5).map((r) => ({
      id: r.id,
      userId: r.userId,
      filename: r.filename,
      originalName: r.originalName,
      status: r.status,
      atsScore: r.atsScore,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    res.json({
      totalResumes,
      averageAtsScore,
      topSkills,
      recentResumes,
      bestJobMatchScore,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch dashboard stats");
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

export default router;
