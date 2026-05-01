import { Link, useLocation } from "wouter";
import { 
  FileText, 
  TrendingUp, 
  Briefcase, 
  Star,
  ArrowRight,
  Clock,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useGetDashboardStats, getGetDashboardStatsQueryKey, useGetResumes, getGetResumesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: isStatsLoading } = useGetDashboardStats({
    query: {
      queryKey: getGetDashboardStatsQueryKey()
    }
  });

  const { data: resumes, isLoading: isResumesLoading } = useGetResumes({
    query: {
      queryKey: getGetResumesQueryKey()
    }
  });

  if (isStatsLoading || isResumesLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-32 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px] w-full rounded-xl" />
          <Skeleton className="h-[300px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const recentResumes = resumes?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your resume performance and job matches.
          </p>
        </div>
        <Button onClick={() => setLocation("/upload")} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New Resume
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalResumes || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Analyzed documents</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. ATS Score</CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageAtsScore ? Math.round(stats.averageAtsScore) : "--"}</div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100 points</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Skills</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.topSkills?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Extracted key skills</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Best Job Match</CardTitle>
            <Briefcase className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.bestJobMatchScore ? `${Math.round(stats.bestJobMatchScore)}%` : "--"}</div>
            <p className="text-xs text-muted-foreground mt-1">Highest match rate</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Resumes</CardTitle>
                <CardDescription>Your recently uploaded and analyzed resumes.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/upload")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentResumes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
                <Button variant="link" onClick={() => setLocation("/upload")} className="mt-2">
                  Upload your first resume
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentResumes.map((resume) => (
                  <div key={resume.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setLocation(`/resumes/${resume.id}`)}>
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-primary/10 p-2 rounded text-primary shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate">{resume.originalName}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {resume.status === 'completed' && resume.atsScore != null && (
                        <Badge variant={resume.atsScore >= 80 ? "default" : resume.atsScore >= 60 ? "secondary" : "destructive"}>
                          {Math.round(resume.atsScore)} ATS
                        </Badge>
                      )}
                      {resume.status !== 'completed' && (
                        <Badge variant="outline" className="capitalize">{resume.status}</Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Top Extracted Skills</CardTitle>
            <CardDescription>The most prominent skills found across your resumes.</CardDescription>
          </CardHeader>
          <CardContent>
            {(!stats?.topSkills || stats.topSkills.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Star className="h-10 w-10 text-muted-foreground mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground">No skills extracted yet.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topSkills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary hover:bg-primary/20 border-none">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}