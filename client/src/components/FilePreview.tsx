import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Download, 
  Share, 
  X, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FileText
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import type { File } from "@shared/schema";

interface FilePreviewProps {
  file: File | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (fileId: string) => void;
  onShare: (fileId: string) => void;
}

export function FilePreview({ file, isOpen, onClose, onDownload, onShare }: FilePreviewProps) {
  const [imageZoom, setImageZoom] = useState(100);
  const [imageRotation, setImageRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  if (!file) return null;

  const isImage = file.mime.startsWith("image/");
  const isVideo = file.mime.startsWith("video/");
  const isAudio = file.mime.startsWith("audio/");
  const isPDF = file.mime === "application/pdf";

  const handleDownload = () => {
    onDownload(file.id);
  };

  const handleShare = () => {
    onShare(file.id);
  };

  const handleOpenInNewTab = () => {
    window.open(`/api/files/${file.id}/download`, '_blank');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const renderPreviewContent = () => {
    if (isImage) {
      return (
        <div className="flex-1 flex items-center justify-center bg-muted/20 rounded-lg overflow-hidden">
          <div 
            className="max-w-full max-h-full transition-transform"
            style={{ 
              transform: `scale(${imageZoom / 100}) rotate(${imageRotation}deg)`,
              transformOrigin: 'center'
            }}
          >
            <img
              src={`/api/files/${file.id}/download`}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              data-testid="image-preview"
            />
          </div>
        </div>
      );
    }

    if (isVideo) {
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 flex items-center justify-center bg-black rounded-lg overflow-hidden">
            <video
              src={`/api/files/${file.id}/download`}
              className="max-w-full max-h-full"
              controls={false}
              data-testid="video-preview"
            />
          </div>
          
          {/* Video Controls */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground" data-testid="video-time-current">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                className="flex-1"
                data-testid="video-progress-slider"
              />
              <span className="text-sm text-muted-foreground" data-testid="video-time-duration">
                {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                data-testid="button-video-play-pause"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  data-testid="button-video-mute"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  className="w-20"
                  onValueChange={(value) => setVolume(value[0])}
                  data-testid="video-volume-slider"
                />
              </div>
              
              <Button
                variant="outline"
                size="icon"
                data-testid="button-video-fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
            <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="h-8 w-8 text-white" />
                ) : (
                  <Play className="h-8 w-8 text-white ml-1" />
                )}
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="font-semibold text-lg" data-testid="audio-title">
              {file.name}.{file.ext}
            </h3>
            <p className="text-muted-foreground">Audio File</p>
          </div>
          
          {/* Audio Controls */}
          <div className="w-full max-w-md space-y-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground" data-testid="audio-time-current">
                {formatTime(currentTime)}
              </span>
              <Slider
                value={[currentTime]}
                max={duration}
                step={1}
                className="flex-1"
                data-testid="audio-progress-slider"
              />
              <span className="text-sm text-muted-foreground" data-testid="audio-time-duration">
                {formatTime(duration)}
              </span>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <Button
                size="lg"
                onClick={() => setIsPlaying(!isPlaying)}
                data-testid="button-audio-play-pause"
              >
                {isPlaying ? <Pause className="h-5 w-5 mr-2" /> : <Play className="h-5 w-5 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsMuted(!isMuted)}
                  data-testid="button-audio-mute"
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                <Slider
                  value={[volume]}
                  max={100}
                  step={1}
                  className="w-20"
                  onValueChange={(value) => setVolume(value[0])}
                  data-testid="audio-volume-slider"
                />
              </div>
            </div>
          </div>
          
          <audio
            src={`/api/files/${file.id}/download`}
            className="hidden"
            data-testid="audio-element"
          />
        </div>
      );
    }

    if (isPDF) {
      return (
        <div className="flex-1 flex flex-col bg-muted/20 rounded-lg">
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-red-500 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">PDF Preview</h3>
                <p className="text-muted-foreground mb-4">
                  PDF.js viewer would be embedded here for inline viewing
                </p>
                <Button onClick={handleOpenInNewTab} data-testid="button-open-pdf-new-tab">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default preview for other file types
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center mx-auto">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Preview not available</h3>
            <p className="text-muted-foreground mb-4">
              This file type cannot be previewed inline
            </p>
            <Button onClick={handleDownload} data-testid="button-download-file">
              <Download className="h-4 w-4 mr-2" />
              Download to view
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] flex flex-col" data-testid="file-preview-modal">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <DialogTitle data-testid="preview-file-name">
                  {file.name}.{file.ext}
                </DialogTitle>
                <p className="text-sm text-muted-foreground" data-testid="preview-file-size">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Image controls */}
              {isImage && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageZoom(Math.max(25, imageZoom - 25))}
                    disabled={imageZoom <= 25}
                    data-testid="button-zoom-out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
                    {imageZoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageZoom(Math.min(400, imageZoom + 25))}
                    disabled={imageZoom >= 400}
                    data-testid="button-zoom-in"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setImageRotation((imageRotation + 90) % 360)}
                    data-testid="button-rotate"
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleDownload}
                data-testid="button-download-preview"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleShare}
                data-testid="button-share-preview"
              >
                <Share className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                data-testid="button-close-preview"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          {renderPreviewContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
