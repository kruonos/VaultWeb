import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Grid3X3, 
  List, 
  Upload, 
  FolderPlus, 
  MoreVertical, 
  Menu,
  Home,
  ChevronRight,
  Download,
  Share,
  Trash
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  selectedItems: string[];
}

export function TopBar({
  currentFolder,
  onFolderChange,
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  selectedItems,
}: TopBarProps) {
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [filterType, setFilterType] = useState("all");
  const isMobile = useIsMobile();

  const fileTypeFilters = [
    { value: "all", label: "All" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
    { value: "audio", label: "Audio" },
    { value: "document", label: "Documents" },
    { value: "archive", label: "Archives" },
  ];

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "modified", label: "Date modified" },
    { value: "size", label: "Size" },
    { value: "type", label: "Type" },
  ];

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 py-3">
        {/* Mobile header */}
        {isMobile && (
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" data-testid="button-menu">
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Vault</h1>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              data-testid="button-mobile-search"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm mb-3" data-testid="breadcrumbs">
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1"
            onClick={() => onFolderChange(null)}
          >
            <Home className="h-4 w-4 mr-1" />
            Home
          </Button>
          {currentFolder && (
            <>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 text-primary"
              >
                Current Folder
              </Button>
            </>
          )}
        </nav>

        {/* Search and Actions */}
        <div className={`flex items-center space-x-3 ${isMobile && !showMobileSearch ? 'hidden' : ''}`}>
          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>

          {/* View Toggle */}
          {!isMobile && (
            <div className="flex items-center space-x-1 bg-muted rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 p-0"
                data-testid="button-grid-view"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewModeChange("list")}
                className="h-8 w-8 p-0"
                data-testid="button-list-view"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <>
                <Button className="flex items-center space-x-2" data-testid="button-upload">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2" data-testid="button-new-folder">
                  <FolderPlus className="h-4 w-4" />
                  <span>New Folder</span>
                </Button>
              </>
            )}

            {/* Selected Items Actions */}
            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" data-testid="badge-selected-count">
                  {selectedItems.length} selected
                </Badge>
                <Button variant="outline" size="sm" data-testid="button-download-selected">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" data-testid="button-share-selected">
                  <Share className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" data-testid="button-delete-selected">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" data-testid="button-more-options">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Select All</DropdownMenuItem>
                <DropdownMenuItem>Refresh</DropdownMenuItem>
                <DropdownMenuItem>View Details</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground" data-testid="text-item-count">
              124 items
            </span>
            <div className="flex items-center space-x-1">
              {fileTypeFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={filterType === filter.value ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setFilterType(filter.value)}
                  data-testid={`filter-${filter.value}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-auto text-xs h-7" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </header>
  );
}
