import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Folder, 
  FileText, 
  FileImage, 
  FileVideo, 
  FileAudio, 
  FileArchive, 
  FileCode,
  MoreHorizontal,
  Download,
  Share,
  Edit,
  Trash,
  Copy
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface FileItemProps {
  item: any;
  viewMode: "grid" | "list";
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onClick: () => void;
}

export function FileItem({ item, viewMode, isSelected, onSelect, onClick }: FileItemProps) {
  const [showActions, setShowActions] = useState(false);

  const getFileIcon = () => {
    if (item.type === "folder") {
      return <Folder className="text-yellow-500" />;
    }

    const ext = item.ext?.toLowerCase();
    const iconClass = "text-2xl md:text-3xl";

    // Image files
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return <FileImage className={cn(iconClass, "text-green-500")} />;
    }
    
    // Video files
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
      return <FileVideo className={cn(iconClass, "text-purple-500")} />;
    }
    
    // Audio files
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(ext)) {
      return <FileAudio className={cn(iconClass, "text-orange-500")} />;
    }
    
    // Document files
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext)) {
      return <FileText className={cn(iconClass, "text-red-500")} />;
    }
    
    // Archive files
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <FileArchive className={cn(iconClass, "text-pink-500")} />;
    }
    
    // Code files
    if (['js', 'ts', 'tsx', 'jsx', 'html', 'css', 'json'].includes(ext)) {
      return <FileCode className={cn(iconClass, "text-cyan-500")} />;
    }
    
    return <FileText className={cn(iconClass, "text-gray-500")} />;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (viewMode === "list") {
    return (
      <div 
        className={cn(
          "grid grid-cols-12 gap-4 p-4 hover:bg-accent cursor-pointer group",
          isSelected && "bg-accent"
        )}
        onClick={onClick}
        data-testid={`${item.type}-${item.id}`}
      >
        <div className="col-span-6 flex items-center space-x-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            data-testid={`checkbox-${item.id}`}
          />
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 flex items-center justify-center">
              {getFileIcon()}
            </div>
            <span className="font-medium truncate">
              {item.name}{item.ext ? `.${item.ext}` : ""}
            </span>
          </div>
        </div>
        
        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
          {item.type === "file" ? formatSize(item.size) : "—"}
        </div>
        
        <div className="col-span-2 flex items-center text-sm text-muted-foreground">
          {item.type === "folder" ? "Folder" : item.ext?.toUpperCase()}
        </div>
        
        <div className="col-span-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>{formatDate(item.updatedAt)}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
                data-testid={`menu-${item.id}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring rounded-lg relative",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      tabIndex={0}
      data-testid={`${item.type}-${item.id}`}
    >
      <div className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow h-full">
        <div className="flex flex-col items-center text-center space-y-2 h-full">
          {/* Thumbnail/Icon */}
          {item.type === "file" && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(item.ext?.toLowerCase()) ? (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded flex items-center justify-center">
              {getFileIcon()}
            </div>
          ) : (
            <div className="w-16 h-16 flex items-center justify-center">
              {getFileIcon()}
            </div>
          )}
          
          {/* Info */}
          <div className="w-full flex-1 flex flex-col justify-end">
            <p className="text-sm font-medium truncate" title={`${item.name}${item.ext ? `.${item.ext}` : ""}`}>
              {item.name}{item.ext ? `.${item.ext}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.type === "folder" ? "Folder" : formatSize(item.size)}
            </p>
          </div>
        </div>
      </div>

      {/* Selection checkbox */}
      <div className="absolute top-2 left-2">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "transition-opacity",
            isSelected || showActions ? "opacity-100" : "opacity-0"
          )}
          data-testid={`checkbox-${item.id}`}
        />
      </div>

      {/* Quick actions */}
      <div className={cn(
        "absolute top-2 right-2 transition-opacity",
        showActions ? "opacity-100" : "opacity-0"
      )}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-8 w-8 shadow-sm"
              onClick={(e) => e.stopPropagation()}
              data-testid={`menu-${item.id}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
