import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { UploadCloud, File, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUploadResume, getGetResumesQueryKey } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const uploadMutation = useUploadResume();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      });
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
      });
      return;
    }
    setFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = () => {
    if (!file) return;

    uploadMutation.mutate(
      { data: { file } },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getGetResumesQueryKey() });
          toast({
            title: "Upload successful",
            description: "Your resume is now being analyzed.",
          });
          setLocation(`/resumes/${data.id}`);
        },
        onError: (error) => {
          toast({
            variant: "destructive",
            title: "Upload failed",
            description: error.error || "There was a problem uploading your resume.",
          });
        },
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground mt-2">
          Upload your resume in PDF format for AI analysis and job matching.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select File</CardTitle>
          <CardDescription>Drag and drop your PDF here, or click to browse.</CardDescription>
        </CardHeader>
        <CardContent>
          {!file ? (
            <div
              className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleChange}
              />
              <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground mb-1">Click or drag file to this area to upload</p>
              <p className="text-sm text-muted-foreground">Support for a single PDF file up to 10MB.</p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <File className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground line-clamp-1 max-w-[200px] sm:max-w-xs">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} disabled={uploadMutation.isPending}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Uploading...</span>
              </div>
              <Progress value={45} className="h-2" />
            </div>
          )}
          
          {uploadMutation.isError && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{uploadMutation.error?.error || "Failed to upload file. Please try again."}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
          <Button variant="outline" onClick={clearFile} disabled={!file || uploadMutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading
              </>
            ) : (
              "Upload and Analyze"
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4 flex gap-3 text-blue-800 dark:text-blue-300 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium mb-1">Privacy Notice</p>
          <p>Your resume is processed securely. We only extract professional information relevant to job matching and analysis. No personal contact information is shared with third parties.</p>
        </div>
      </div>
    </div>
  );
}
