import { useState } from "react";
import { useLocation } from "wouter";
import { 
  useGetJobs, 
  getGetJobsQueryKey,
  useGetResumes,
  getGetResumesQueryKey
} from "@workspace/api-client-react";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("none");
  const [, setLocation] = useLocation();

  const { data: resumes } = useGetResumes({
    query: {
      queryKey: getGetResumesQueryKey()
    }
  });

  const validResumes = resumes?.filter(r => r.status === "completed") || [];
  
  const queryParams = {
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    resumeId: selectedResumeId !== "none" ? parseInt(selectedResumeId, 10) : undefined
  };

  const { data: jobs, isLoading } = useGetJobs(queryParams, {
    query: {
      queryKey: getGetJobsQueryKey(queryParams)
    }
  });

  const categories = [
    "all",
    "Software Engineering",
    "Data Science",
    "Product Management",
    "Design",
    "Marketing",
    "Sales"
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Job Market</h1>
        <p className="text-muted-foreground mt-1">
          Browse open positions and see how well your profile matches.
        </p>
      </div>

      <Card className="border-none shadow-none bg-muted/30">
        <CardContent className="p-4 grid gap-4 md:grid-cols-12 items-end">
          <div className="space-y-2 md:col-span-5">
            <label className="text-sm font-medium text-foreground">Search Jobs</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Job title, keywords, or company"
                className="pl-9 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2 md:col-span-3">
            <label className="text-sm font-medium text-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-background">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <SelectValue placeholder="All Categories" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === "all" ? "All Categories" : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-4">
            <label className="text-sm font-medium text-foreground">Match Against Resume</label>
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select a resume to see matches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Don't match against resume</SelectItem>
                {validResumes.map((resume) => (
                  <SelectItem key={resume.id.toString()} value={resume.id.toString()}>
                    {resume.originalName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-full max-w-md">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <div className="flex gap-2 pt-2">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full mt-6" />
                  <Skeleton className="h-4 w-5/6 mt-2" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : !jobs || jobs.length === 0 ? (
          <div className="text-center py-20 bg-muted/10 rounded-lg border border-dashed">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground">No jobs found</h3>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters.</p>
            {(search || category !== "all") && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearch(""); setCategory("all"); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => {
              const isMatched = 'matchPercentage' in job;
              const matchPercentage = isMatched ? (job as any).matchPercentage : null;
              
              return (
                <Card key={job.id} className="overflow-hidden transition-all hover:shadow-md group">
                  <div className="flex flex-col md:flex-row">
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-semibold text-primary">{job.company}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(new Date(job.postedAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        
                        {isMatched && (
                          <div className="flex flex-col items-end shrink-0 ml-4 bg-primary/5 p-3 rounded-lg border border-primary/10">
                            <div className="text-2xl font-bold text-primary">{Math.round(matchPercentage)}%</div>
                            <span className="text-[10px] text-primary uppercase tracking-wider font-bold">Match</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 mb-4">
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Briefcase className="w-4 h-4" />
                          {job.category}
                        </div>
                        {(job.salaryMin || job.salaryMax) && (
                          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                            <DollarSign className="w-4 h-4 text-green-600 dark:text-green-500" />
                            {job.salaryMin ? `$${(job.salaryMin/1000).toFixed(0)}k` : ''} 
                            {job.salaryMin && job.salaryMax ? ' - ' : ''} 
                            {job.salaryMax ? `$${(job.salaryMax/1000).toFixed(0)}k` : ''}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                        {job.description}
                      </p>
                      
                      <div className="space-y-3">
                        {isMatched && (job as any).matchedSkills?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> 
                              Matched Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(job as any).matchedSkills.map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 border-none">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {isMatched && (job as any).missingSkills?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                              <XCircle className="w-3.5 h-3.5 text-destructive" /> 
                              Missing Skills
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {(job as any).missingSkills.map((s: string) => (
                                <Badge key={s} variant="outline" className="text-xs text-muted-foreground opacity-75">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {!isMatched && job.requiredSkills?.length > 0 && (
                          <div>
                            <div className="flex flex-wrap gap-1.5">
                              {job.requiredSkills.slice(0, 8).map((s: string) => (
                                <Badge key={s} variant="secondary" className="text-xs font-medium">
                                  {s}
                                </Badge>
                              ))}
                              {job.requiredSkills.length > 8 && (
                                <Badge variant="outline" className="text-xs text-muted-foreground border-dashed">
                                  +{job.requiredSkills.length - 8} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 p-4 md:w-48 flex flex-row md:flex-col items-center justify-center gap-3 border-t md:border-t-0 md:border-l">
                      <Button className="w-full">
                        Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                      <Button variant="outline" className="w-full bg-background">
                        Save Job
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
