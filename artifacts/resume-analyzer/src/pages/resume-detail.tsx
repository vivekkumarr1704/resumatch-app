import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetResume, getGetResumeQueryKey, useGetJobMatches, getGetJobMatchesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Briefcase,
  Star,
  ChevronRight,
  Loader2,
  ThumbsUp,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from "recharts";
import { formatDistanceToNow } from "date-fns";

export default function ResumeDetail() {
  const [, params] = useRoute("/resumes/:resumeId");
  const resumeId = params?.resumeId ? parseInt(params.resumeId, 10) : 0;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useGetResume(resumeId, {
    query: {
      enabled: !!resumeId,
      queryKey: getGetResumeQueryKey(resumeId),
      refetchInterval: (query) => {
        const status = query.state.data?.resume.status;
        return status === "pending" || status === "analyzing" ? 2000 : false;
      }
    }
  });

  const isCompleted = data?.resume.status === "completed";

  const { data: matches, isLoading: matchesLoading } = useGetJobMatches(resumeId, {
    query: {
      enabled: isCompleted,
      queryKey: getGetJobMatchesQueryKey(resumeId)
    }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Failed to load resume</h2>
        <p className="text-muted-foreground mt-2 mb-4">The resume might not exist or you don't have access.</p>
        <Button onClick={() => setLocation("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          <Skeleton className="h-[300px] w-full rounded-xl col-span-1" />
          <Skeleton className="h-[300px] w-full rounded-xl col-span-2" />
        </div>
      </div>
    );
  }

  const { resume, analysis } = data;

  if (resume.status === "pending" || resume.status === "analyzing") {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold">Analyzing your resume...</h2>
        <p className="text-muted-foreground">
          Our AI is extracting your skills, experience, and scoring your resume against ATS standards.
          This usually takes about 10-30 seconds.
        </p>
        <Card className="mt-8 text-left bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-medium capitalize">{resume.status}</span>
              <span className="text-muted-foreground">Please wait</span>
            </div>
            <Progress value={resume.status === "pending" ? 30 : 70} className="h-2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resume.status === "failed") {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center space-y-6">
        <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-12 h-12" />
        </div>
        <h2 className="text-2xl font-bold">Analysis Failed</h2>
        <p className="text-muted-foreground">
          We couldn't process this document. It might be password protected, corrupted, or contain unreadable text.
        </p>
        <Button onClick={() => setLocation("/upload")}>Upload a different file</Button>
      </div>
    );
  }

  const score = analysis?.atsScore || 0;
  const chartData = [
    { name: "Score", value: score, fill: score >= 80 ? "hsl(var(--primary))" : score >= 60 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))" },
    { name: "Remaining", value: 100 - score, fill: "hsl(var(--muted))" }
  ];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/5">Analysis Complete</Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(resume.updatedAt), { addSuffix: true })}
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{resume.originalName}</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            {analysis?.summary}
          </p>
        </div>
        <Button onClick={() => setLocation("/jobs")}>
          Find Jobs <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        <Card className="md:col-span-4">
          <CardHeader className="pb-0">
            <CardTitle>ATS Readiness Score</CardTitle>
            <CardDescription>How well tracking systems read your resume</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center pt-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <Label
                      value={score}
                      position="center"
                      className="text-4xl font-bold fill-foreground"
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center mt-2">
              <h3 className="font-semibold text-lg">
                {score >= 80 ? "Excellent" : score >= 60 ? "Good" : "Needs Work"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {score >= 80 
                  ? "Your resume parses well and contains strong keywords." 
                  : "Consider addressing the improvements below to increase your score."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-8">
          <CardHeader>
            <CardTitle>Suggested Improvements</CardTitle>
            <CardDescription>Actionable advice to strengthen your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {analysis?.improvements?.map((improvement, index) => (
                <li key={index} className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-sm">{improvement}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="w-full mt-8">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
          <TabsTrigger value="skills" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">
            Extracted Skills
          </TabsTrigger>
          <TabsTrigger value="experience" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">
            Parsed Experience
          </TabsTrigger>
          <TabsTrigger value="matches" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-6 py-3">
            Top Job Matches
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="skills" className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical & Hard Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis?.skills?.map((skill, i) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm font-medium">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keywords Detected</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis?.keywords?.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1.5 text-sm bg-background">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="experience" className="pt-6">
          <div className="space-y-6">
            {analysis?.experience?.map((exp, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{exp.title}</CardTitle>
                      <CardDescription className="text-base text-primary font-medium mt-1">{exp.company}</CardDescription>
                    </div>
                    <Badge variant="outline" className="w-fit">{exp.duration}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                    {exp.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="matches" className="pt-6">
          {matchesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !matches || matches.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <h3 className="text-lg font-medium">No matches found yet</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">We're still analyzing the job market against your profile.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {matches.slice(0, 5).map((match, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{match.job.title}</h3>
                          <p className="text-primary font-medium text-sm">{match.job.company}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <div className="text-2xl font-bold text-primary">{Math.round(match.matchPercentage)}%</div>
                          <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Match</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{match.job.location} • {match.job.category}</p>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Matched Skills</p>
                          <div className="flex flex-wrap gap-1.5">
                            {match.matchedSkills.map(s => (
                              <Badge key={s} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        {match.missingSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Missing Skills</p>
                            <div className="flex flex-wrap gap-1.5">
                              {match.missingSkills.map(s => (
                                <Badge key={s} variant="outline" className="text-xs text-muted-foreground">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              <div className="flex justify-center pt-4">
                <Button variant="outline" onClick={() => setLocation("/jobs")}>View All Matches</Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
