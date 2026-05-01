import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || "",
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface ResumeAnalysisResult {
  skills: string[];
  experience: ExperienceItem[];
  keywords: string[];
  atsScore: number;
  improvements: string[];
  summary: string;
}

export async function analyzeResumeText(text: string): Promise<ResumeAnalysisResult> {
  const prompt = `You are an expert ATS (Applicant Tracking System) and resume analyst. Analyze the following resume text and provide a detailed assessment.

Resume Text:
${text.slice(0, 8000)}

Respond with a valid JSON object with exactly this structure:
{
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Jan 2020 - Dec 2022",
      "description": "Key responsibilities and achievements"
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "atsScore": 75,
  "improvements": [
    "Add more quantifiable achievements",
    "Include relevant certifications"
  ],
  "summary": "Brief summary of the candidate profile"
}

ATS scoring guide:
- 85-100: Excellent resume, well-structured, strong keywords
- 70-84: Good resume with minor improvements needed
- 55-69: Average resume, significant improvements needed
- Below 55: Poor resume, major restructuring needed

Extract all technical and soft skills. List work experience chronologically (most recent first). Provide 5-8 specific, actionable improvements. Keywords should include job-relevant terms found in the resume.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from AI");
  }

  const parsed = JSON.parse(content) as ResumeAnalysisResult;

  return {
    skills: parsed.skills || [],
    experience: parsed.experience || [],
    keywords: parsed.keywords || [],
    atsScore: Math.min(100, Math.max(0, parsed.atsScore || 50)),
    improvements: parsed.improvements || [],
    summary: parsed.summary || "",
  };
}
