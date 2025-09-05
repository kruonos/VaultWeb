import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  Plus, 
  Share, 
  Settings,
  Upload,
  FolderPlus,
  Menu
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  currentFolder: string | null;
  onFolderChange: (folderId: string | null) => void;
}

export function MobileBottomNav({ currentFolder, onFolderChange }: MobileBottomNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    {
      id: "files",
      label: "Files",
      icon: Home,
      active: true,
      onClick: () => onFolderChange(null),
      testId: "nav-files"
    },
    {
      id: "search",
      label: "Search", 
      icon: Search,
      active: false,
      onClick: () => console.log("Search clicked"),
      testId: "nav-search"
    },
    {
      id: "add",
      label: "Add",
      icon: Plus,
      active: false,
      isAction: true,
      onClick: () => setIsMenuOpen(true),
      testId: "nav-add"
    },
    {
      id: "shared",
      label: "Shared",
      icon: Share,
      active: false,
      onClick: () => console.log("Shared clicked"),
      testId: "nav-shared"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      active: false,
      onClick: () => console.log("Settings clicked"),
      testId: "nav-settings"
    }
  ];

  const actionMenuItems = [
    {
      id: "upload",
      label: "Upload Files",
      icon: Upload,
      description: "Select files from your device",
      onClick: () => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = true;
        input.click();
        setIsMenuOpen(false);
      },
      testId: "action-upload"
    },
    {
      id: "new-folder",
      label: "New Folder", 
      icon: FolderPlus,
      description: "Create a new folder",
      onClick: () => {
        console.log("Create new folder");
        setIsMenuOpen(false);
      },
      testId: "action-new-folder"
    }
  ];

  return (
    <>
      <div className="lg:hidden bottom-nav bg-card border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            
            if (item.isAction) {
              return (
                <Sheet key={item.id} open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className="h-12 w-12 rounded-full"
                      data-testid={item.testId}
                    >
                      <Icon className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-auto">
                    <SheetHeader className="pb-4">
                      <SheetTitle>Add New</SheetTitle>
                      <SheetDescription>
                        Choose what you'd like to add to your vault
                      </SheetDescription>
                    </SheetHeader>
                    
                    <div className="space-y-2">
                      {actionMenuItems.map((actionItem) => {
                        const ActionIcon = actionItem.icon;
                        return (
                          <Button
                            key={actionItem.id}
                            variant="ghost"
                            className="w-full justify-start h-auto p-4"
                            onClick={actionItem.onClick}
                            data-testid={actionItem.testId}
                          >
                            <ActionIcon className="h-5 w-5 mr-3" />
                            <div className="text-left">
                              <div className="font-medium">{actionItem.label}</div>
                              <div className="text-sm text-muted-foreground">
                                {actionItem.description}
                              </div>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              );
            }
            
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "flex flex-col items-center space-y-1 h-auto py-2 px-3",
                  item.active ? "text-primary" : "text-muted-foreground"
                )}
                onClick={item.onClick}
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile Sidebar Menu */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-40 bg-card border border-border shadow-sm"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-full flex flex-col">
            <SheetHeader className="p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">V</span>
                </div>
                <SheetTitle>Vault</SheetTitle>
              </div>
            </SheetHeader>
            
            <nav className="flex-1 p-4 space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => onFolderChange(null)}
                data-testid="mobile-nav-my-files"
              >
                <Home className="h-4 w-4 mr-3" />
                My Files
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                data-testid="mobile-nav-shared"
              >
                <Share className="h-4 w-4 mr-3" />
                Shared
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                data-testid="mobile-nav-settings"
              >
                <Settings className="h-4 w-4 mr-3" />
                Settings
              </Button>
            </nav>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
