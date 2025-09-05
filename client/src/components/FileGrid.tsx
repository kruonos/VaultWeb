import { useMemo } from "react";
import { FileItem } from "./FileItem";
import type { File, Folder } from "@shared/schema";

interface FileGridProps {
  folders: Folder[];
  files: File[];
  viewMode: "grid" | "list";
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
  onFolderOpen: (folderId: string) => void;
  searchQuery: string;
}

export function FileGrid({
  folders,
  files,
  viewMode,
  selectedItems,
  onSelectionChange,
  onFolderOpen,
  searchQuery,
}: FileGridProps) {
  const filteredFolders = useMemo(() => {
    if (!searchQuery) return folders;
    return folders.filter(folder =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [folders, searchQuery]);

  const filteredFiles = useMemo(() => {
    if (!searchQuery) return files;
    return files.filter(file =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.ext.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [files, searchQuery]);

  const handleItemClick = (id: string, type: "file" | "folder") => {
    if (type === "folder") {
      onFolderOpen(id);
    } else {
      // Handle file preview
      console.log("Preview file:", id);
    }
  };

  const handleItemSelect = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedItems, id]);
    } else {
      onSelectionChange(selectedItems.filter(item => item !== id));
    }
  };

  const allItems = [
    ...filteredFolders.map(folder => ({ ...folder, type: "folder" as const })),
    ...filteredFiles.map(file => ({ ...file, type: "file" as const }))
  ];

  if (allItems.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
            <span className="text-4xl">📁</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">No files found</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search query" : "This folder is empty"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* List header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border text-sm font-medium text-muted-foreground">
            <div className="col-span-6">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Modified</div>
          </div>
          
          {/* List items */}
          <div className="divide-y divide-border">
            {allItems.map((item) => (
              <FileItem
                key={item.id}
                item={item}
                viewMode="list"
                isSelected={selectedItems.includes(item.id)}
                onSelect={(selected) => handleItemSelect(item.id, selected)}
                onClick={() => handleItemClick(item.id, item.type)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="flex-1 p-4 overflow-auto">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
        {allItems.map((item) => (
          <FileItem
            key={item.id}
            item={item}
            viewMode="grid"
            isSelected={selectedItems.includes(item.id)}
            onSelect={(selected) => handleItemSelect(item.id, selected)}
            onClick={() => handleItemClick(item.id, item.type)}
          />
        ))}
      </div>
    </main>
  );
}
