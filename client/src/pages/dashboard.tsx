import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { FileGrid } from "@/components/FileGrid";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { UploadProgress } from "@/components/UploadProgress";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const isMobile = useIsMobile();

  const { data: folders = [] } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: async () => {
      const res = await fetch(`/api/folders?parent=${currentFolder || ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const { data: files = [] } = useQuery({
    queryKey: ["/api/files", currentFolder],
    queryFn: async () => {
      const res = await fetch(`/api/files?folder=${currentFolder || ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch files");
      return res.json();
    },
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sidebar 
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          selectedItems={selectedItems}
        />

        <FileGrid
          folders={folders}
          files={files}
          viewMode={viewMode}
          selectedItems={selectedItems}
          onSelectionChange={setSelectedItems}
          onFolderOpen={setCurrentFolder}
          searchQuery={searchQuery}
        />
      </div>

      {/* Mobile Bottom Navigation */}
      {isMobile && (
        <MobileBottomNav 
          currentFolder={currentFolder}
          onFolderChange={setCurrentFolder}
        />
      )}

      {/* Upload Progress */}
      <UploadProgress />
    </div>
  );
}
