import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { FileGrid } from "./FileGrid";
import { Button } from "@/components/ui/button";
import { CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FileExplorerProps {
  folders: any[];
  files: any[];
  viewMode: "grid" | "list";
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onFolderOpen: (folderId: string) => void;
  searchQuery: string;
  currentFolder: string | null;
}

export function FileExplorer({
  folders,
  files,
  viewMode,
  selectedItems,
  onSelectionChange,
  onFolderOpen,
  searchQuery,
  currentFolder,
}: FileExplorerProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const uploadPromises = files.map(async (file) => {
        if (process.env.VITE_STORAGE_DRIVER === "s3") {
          // Initialize multipart upload
          const initRes = await apiRequest("POST", "/api/upload/init", {
            filename: file.name,
            size: file.size,
            folderId: currentFolder,
          });
          const { uploadId, presignedUrls, fileId } = await initRes.json();

          // Upload parts (simplified - in reality would chunk the file)
          const parts = [];
          const formData = new FormData();
          formData.append("file", file);

          for (let i = 0; i < presignedUrls.length && i < 1; i++) {
            const response = await fetch(presignedUrls[i], {
              method: "PUT",
              body: formData,
            });
            
            parts.push({
              ETag: response.headers.get("ETag")?.replace(/"/g, "") || "",
              PartNumber: i + 1,
            });
          }

          // Complete upload
          await apiRequest("POST", "/api/upload/complete", {
            fileId,
            uploadId,
            parts,
          });
        } else {
          // Local upload
          const formData = new FormData();
          formData.append("file", file);
          if (currentFolder) {
            formData.append("folderId", currentFolder);
          }

          await fetch("/api/upload/local", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
        }
      });

      await Promise.all(uploadPromises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me/usage"] });
      toast({
        title: "Upload successful",
        description: "Your files have been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setIsDragOver(false);
      if (acceptedFiles.length > 0) {
        uploadMutation.mutate(acceptedFiles);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    multiple: true,
    noClick: true,
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      uploadMutation.mutate(files);
    }
    event.target.value = "";
  };

  const hasItems = folders.length > 0 || files.length > 0;

  return (
    <div {...getRootProps()} className="flex-1 flex flex-col overflow-hidden relative">
      <input {...getInputProps()} />
      
      {/* Hidden file input for manual upload */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        data-testid="file-input-hidden"
      />

      {/* Drop zone overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center">
          <div className="bg-card border-2 border-dashed border-primary rounded-xl p-8 text-center max-w-md mx-4">
            <CloudUpload className="h-16 w-16 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Drop files to upload</h3>
            <p className="text-muted-foreground">Release to start uploading your files</p>
          </div>
        </div>
      )}

      {hasItems || searchQuery ? (
        <FileGrid
          folders={folders}
          files={files}
          viewMode={viewMode}
          selectedItems={selectedItems}
          onSelectionChange={onSelectionChange}
          onFolderOpen={onFolderOpen}
          searchQuery={searchQuery}
        />
      ) : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
              <CloudUpload className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">No files yet</h3>
              <p className="text-muted-foreground mb-6">
                Upload your first files to get started with Vault. You can drag and drop files here or click the button below.
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadMutation.isPending}
                data-testid="button-upload-first-file"
              >
                <CloudUpload className="h-4 w-4 mr-2" />
                {uploadMutation.isPending ? "Uploading..." : "Upload Files"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
