import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Vault, Home, Share, Clock, Trash, Folder, Moon, Sun, Palette, ChevronRight, ChevronDown } from "lucide-react";

interface SidebarProps {
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
}

export function Sidebar({ currentFolder, onFolderChange }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const { data: usage } = useQuery({
    queryKey: ["/api/me/usage"],
    queryFn: async () => {
      const res = await fetch("/api/me/usage", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    },
  });

  const { data: rootFolders = [] } = useQuery({
    queryKey: ["/api/folders", null],
    queryFn: async () => {
      const res = await fetch("/api/folders?parent=", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return <Sun className="h-4 w-4" />;
      case "dim": return <Moon className="h-4 w-4" />;
      case "black": return <Palette className="h-4 w-4" />;
    }
  };

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

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Vault className="h-4 w-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-semibold">Vault</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
          data-testid="button-theme-toggle"
        >
          {getThemeIcon()}
        </Button>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-medium text-sm">
              {user?.name?.charAt(0) || "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-username">
              {user?.name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Storage Usage */}
        {usage && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Storage Used</span>
              <span data-testid="text-storage-usage">
                {formatSize(usage.totalSize)} / {formatSize(usage.quota)}
              </span>
            </div>
            <Progress value={usage.percentage} className="h-2" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          <Button
            variant={currentFolder === null ? "secondary" : "ghost"}
            className="w-full justify-start"
            onClick={() => onFolderChange(null)}
            data-testid="button-my-files"
          >
            <Home className="h-4 w-4 mr-3" />
            My Files
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" data-testid="button-shared">
            <Share className="h-4 w-4 mr-3" />
            Shared
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" data-testid="button-recent">
            <Clock className="h-4 w-4 mr-3" />
            Recent
          </Button>
          
          <Button variant="ghost" className="w-full justify-start" data-testid="button-trash">
            <Trash className="h-4 w-4 mr-3" />
            Trash
          </Button>
        </div>

        {/* Folder Tree */}
        {rootFolders.length > 0 && (
          <div className="pt-4">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Folders
            </h3>
            <div className="space-y-1">
              {rootFolders.map((folder: any) => (
                <FolderItem
                  key={folder.id}
                  folder={folder}
                  isExpanded={expandedFolders.has(folder.id)}
                  onToggle={() => toggleFolder(folder.id)}
                  onClick={() => onFolderChange(folder.id)}
                  isSelected={currentFolder === folder.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="pt-4 mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>
      </nav>
    </div>
  );
}

interface FolderItemProps {
  folder: any;
  isExpanded: boolean;
  onToggle: () => void;
  onClick: () => void;
  isSelected: boolean;
  level?: number;
}

function FolderItem({ folder, isExpanded, onToggle, onClick, isSelected, level = 0 }: FolderItemProps) {
  const { data: subFolders = [] } = useQuery({
    queryKey: ["/api/folders", folder.id],
    queryFn: async () => {
      const res = await fetch(`/api/folders?parent=${folder.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch subfolders");
      return res.json();
    },
    enabled: isExpanded,
  });

  const hasSubFolders = subFolders.length > 0;

  return (
    <div>
      <div 
        className={`flex items-center px-2 py-1 rounded hover:bg-accent cursor-pointer ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {hasSubFolders ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 mr-1"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}
        
        <div className="flex items-center flex-1 min-w-0" onClick={onClick}>
          <Folder className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
          <span className="text-sm truncate">{folder.name}</span>
        </div>
      </div>

      {isExpanded && hasSubFolders && (
        <div>
          {subFolders.map((subFolder: any) => (
            <FolderItem
              key={subFolder.id}
              folder={subFolder}
              isExpanded={false} // Only expand one level for now
              onToggle={() => {}}
              onClick={() => onClick()}
              isSelected={false}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
