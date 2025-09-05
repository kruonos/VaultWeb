import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  X, 
  Check, 
  AlertCircle,
  Pause,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadItem {
  id: string;
  name: string;
  size: number;
  uploadedBytes: number;
  status: "pending" | "uploading" | "completed" | "error" | "paused";
  error?: string;
  type: string;
}

interface UploadProgressProps {
  className?: string;
}

export function UploadProgress({ className }: UploadProgressProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);

  // Mock upload state for demonstration - in real app this would come from upload context/store
  useEffect(() => {
    // Simulate upload progress updates
    const interval = setInterval(() => {
      setUploads(current => 
        current.map(upload => {
          if (upload.status === "uploading" && upload.uploadedBytes < upload.size) {
            const increment = Math.min(upload.size * 0.1, upload.size - upload.uploadedBytes);
            const newUploaded = upload.uploadedBytes + increment;
            return {
              ...upload,
              uploadedBytes: newUploaded,
              status: newUploaded >= upload.size ? "completed" : "uploading"
            };
          }
          return upload;
        })
      );
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const formatSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getFileIcon = (type: string) => {
    const iconClass = "h-5 w-5";
    
    if (type.startsWith("image/")) {
      return <FileImage className={cn(iconClass, "text-green-500")} />;
    }
    if (type.startsWith("video/")) {
      return <FileVideo className={cn(iconClass, "text-purple-500")} />;
    }
    if (type.startsWith("audio/")) {
      return <FileAudio className={cn(iconClass, "text-orange-500")} />;
    }
    return <FileText className={cn(iconClass, "text-blue-500")} />;
  };

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case "completed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "paused":
        return <Pause className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  const totalFiles = uploads.length;
  const completedFiles = uploads.filter(u => u.status === "completed").length;
  const totalBytes = uploads.reduce((sum, u) => sum + u.size, 0);
  const uploadedBytes = uploads.reduce((sum, u) => sum + u.uploadedBytes, 0);
  const overallProgress = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

  const handleCancel = (id: string) => {
    setUploads(current => current.filter(u => u.id !== id));
  };

  const handlePauseResume = (id: string) => {
    setUploads(current => 
      current.map(u => 
        u.id === id 
          ? { ...u, status: u.status === "paused" ? "uploading" : "paused" }
          : u
      )
    );
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || uploads.length === 0) {
    return null;
  }

  return (
    <Card className={cn("fixed bottom-4 right-4 w-80 max-h-96 z-40 shadow-lg", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Uploading Files</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClose}
            data-testid="button-close-upload-progress"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span data-testid="text-overall-progress">
              {completedFiles} of {totalFiles} files
            </span>
            <span>{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
          {uploads.map((upload) => {
            const progress = upload.size > 0 ? Math.round((upload.uploadedBytes / upload.size) * 100) : 0;
            
            return (
              <div key={upload.id} className="flex items-center space-x-3" data-testid={`upload-item-${upload.id}`}>
                {getFileIcon(upload.type)}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={upload.name}>
                    {upload.name}
                  </p>
                  
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>
                      {formatSize(upload.uploadedBytes)} / {formatSize(upload.size)}
                    </span>
                    <span data-testid={`upload-status-${upload.id}`}>
                      {upload.status === "completed" ? "Complete" : 
                       upload.status === "error" ? "Error" :
                       upload.status === "paused" ? "Paused" : `${progress}%`}
                    </span>
                  </div>
                  
                  <Progress 
                    value={progress} 
                    className={cn(
                      "h-1",
                      upload.status === "error" && "bg-destructive/20"
                    )}
                  />
                  
                  {upload.error && (
                    <p className="text-xs text-destructive mt-1">{upload.error}</p>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  {getStatusIcon(upload.status)}
                  
                  {upload.status === "uploading" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handlePauseResume(upload.id)}
                      data-testid={`button-pause-${upload.id}`}
                    >
                      <Pause className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {upload.status === "paused" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handlePauseResume(upload.id)}
                      data-testid={`button-resume-${upload.id}`}
                    >
                      <Play className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {(upload.status === "pending" || upload.status === "uploading" || upload.status === "paused" || upload.status === "error") && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCancel(upload.id)}
                      data-testid={`button-cancel-${upload.id}`}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
