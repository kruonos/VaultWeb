import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Copy, Share, Check, Eye, Download, Lock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { File, Folder } from "@shared/schema";

interface ShareDialogProps {
  item: (File | Folder) | null;
  itemType: "file" | "folder" | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareDialog({ item, itemType, isOpen, onClose }: ShareDialogProps) {
  const [shareLink, setShareLink] = useState("");
  const [permission, setPermission] = useState("view");
  const [expiry, setExpiry] = useState("never");
  const [customExpiry, setCustomExpiry] = useState("");
  const [passwordEnabled, setPasswordEnabled] = useState(false);
  const [password, setPassword] = useState("");
  const [linkCreated, setLinkCreated] = useState(false);
  const { toast } = useToast();

  const createShareMutation = useMutation({
    mutationFn: async (data: {
      resourceType: "file" | "folder";
      resourceId: string;
      expiresAt?: string;
      password?: string;
      allowDownload: boolean;
    }) => {
      const res = await apiRequest("POST", "/api/shares", data);
      return res.json();
    },
    onSuccess: (data) => {
      setShareLink(data.url);
      setLinkCreated(true);
      toast({
        title: "Share link created",
        description: "Your share link has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create share link",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast({
        title: "Copied to clipboard",
        description: "Share link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleCreateLink = () => {
    if (!item || !itemType) return;

    let expiresAt: string | undefined;
    
    if (expiry !== "never") {
      const now = new Date();
      switch (expiry) {
        case "1day":
          expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          break;
        case "7days":
          expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "30days":
          expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case "custom":
          if (customExpiry) {
            expiresAt = new Date(customExpiry).toISOString();
          }
          break;
      }
    }

    createShareMutation.mutate({
      resourceType: itemType,
      resourceId: item.id,
      expiresAt,
      password: passwordEnabled ? password : undefined,
      allowDownload: permission === "download",
    });
  };

  const handleClose = () => {
    setShareLink("");
    setLinkCreated(false);
    setPermission("view");
    setExpiry("never");
    setCustomExpiry("");
    setPasswordEnabled(false);
    setPassword("");
    onClose();
  };

  if (!item || !itemType) return null;

  const itemName =
    itemType === "file"
      ? `${item.name}${(item as File).ext ? `.${(item as File).ext}` : ""}`
      : item.name;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Share className="h-5 w-5" />
            <span>Share {itemType}</span>
          </DialogTitle>
          <DialogDescription>
            Create a secure link to share "{itemName}" with others.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Share Link Display */}
          {linkCreated && shareLink && (
            <div className="space-y-2">
              <Label>Share Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={shareLink}
                  readOnly
                  className="font-mono text-sm"
                  data-testid="input-share-link"
                />
                <Button
                  onClick={copyToClipboard}
                  className="flex items-center space-x-2"
                  data-testid="button-copy-link"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </Button>
              </div>
            </div>
          )}

          {/* Permissions */}
          <div className="space-y-3">
            <Label>Permissions</Label>
            <RadioGroup 
              value={permission} 
              onValueChange={setPermission}
              disabled={linkCreated}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view" id="view" data-testid="radio-permission-view" />
                <Label htmlFor="view" className="flex items-center space-x-2 cursor-pointer">
                  <Eye className="h-4 w-4" />
                  <span>View only</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="download" id="download" data-testid="radio-permission-download" />
                <Label htmlFor="download" className="flex items-center space-x-2 cursor-pointer">
                  <Download className="h-4 w-4" />
                  <span>View and download</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Expiry */}
          <div className="space-y-3">
            <Label>Link expires</Label>
            <Select 
              value={expiry} 
              onValueChange={setExpiry}
              disabled={linkCreated}
            >
              <SelectTrigger data-testid="select-expiry">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
                <SelectItem value="7days">7 days</SelectItem>
                <SelectItem value="30days">30 days</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {expiry === "custom" && (
              <Input
                type="datetime-local"
                value={customExpiry}
                onChange={(e) => setCustomExpiry(e.target.value)}
                disabled={linkCreated}
                data-testid="input-custom-expiry"
              />
            )}
          </div>

          {/* Password Protection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>Password protection</span>
              </Label>
              <Switch
                checked={passwordEnabled}
                onCheckedChange={setPasswordEnabled}
                disabled={linkCreated}
                data-testid="switch-password-protection"
              />
            </div>

            {passwordEnabled && (
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={linkCreated}
                data-testid="input-password"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} data-testid="button-cancel-share">
              {linkCreated ? "Close" : "Cancel"}
            </Button>
            
            {!linkCreated && (
              <Button
                onClick={handleCreateLink}
                disabled={createShareMutation.isPending || (passwordEnabled && !password)}
                data-testid="button-create-link"
              >
                {createShareMutation.isPending ? "Creating..." : "Create Link"}
              </Button>
            )}
          </div>

          {/* Link Status */}
          {linkCreated && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span className="font-medium">Link created successfully</span>
              </div>
              
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Expires: {expiry === "never" ? "Never" : 
                             expiry === "1day" ? "In 1 day" :
                             expiry === "7days" ? "In 7 days" :
                             expiry === "30days" ? "In 30 days" :
                             customExpiry ? new Date(customExpiry).toLocaleDateString() : "Never"}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {permission === "view" ? (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>View only access</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3" />
                      <span>View and download access</span>
                    </>
                  )}
                </div>
                
                {passwordEnabled && (
                  <div className="flex items-center space-x-2">
                    <Lock className="h-3 w-3" />
                    <span>Password protected</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
