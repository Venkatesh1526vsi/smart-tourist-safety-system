import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mic,
  Square,
  Play,
  Pause,
  ImagePlus,
  Video,
  X,
} from "lucide-react";

export interface EvidenceData {
  description: string;
  images: File[];
  video: File | null;
  voiceRecording: boolean;
}

interface EvidenceUploadSectionProps {
  evidence: EvidenceData;
  onEvidenceChange: (evidence: EvidenceData) => void;
}

const EvidenceUploadSection = ({
  evidence,
  onEvidenceChange,
}: EvidenceUploadSectionProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleDescriptionChange = (value: string) => {
    onEvidenceChange({ ...evidence, description: value });
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setHasRecording(true);
      onEvidenceChange({ ...evidence, voiceRecording: true });
    } else {
      setIsRecording(true);
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => setIsPlaying(!isPlaying);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    onEvidenceChange({ ...evidence, images: [...evidence.images, ...files] });
  };

  const removeImage = (index: number) => {
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    onEvidenceChange({
      ...evidence,
      images: evidence.images.filter((_, i) => i !== index),
    });
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
      onEvidenceChange({ ...evidence, video: file });
    }
  };

  const removeVideo = () => {
    setVideoPreview(null);
    onEvidenceChange({ ...evidence, video: null });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    onEvidenceChange({ ...evidence, images: [...evidence.images, ...files] });
  };

  return (
    <div className="space-y-4">
      {/* Text Description */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <Textarea
          placeholder="Describe the evidence or situation..."
          value={evidence.description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Voice Recording */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Voice Recording</Label>
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <Button
              type="button"
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              onClick={toggleRecording}
              className={isRecording ? "" : "border-emerald text-emerald hover:bg-emerald/10"}
            >
              {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            {hasRecording && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={togglePlayback}
                className="border-sky text-sky hover:bg-sky/10"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            )}
            <span className="text-sm text-muted-foreground">
              {isRecording
                ? "Recording..."
                : hasRecording
                ? "Recording saved"
                : "Tap to record"}
            </span>
            {isRecording && (
              <span className="relative ml-auto flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-critical" />
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Images</Label>
        <div
          className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-emerald/50 hover:bg-emerald/5"
          onClick={() => imageInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Click or drag images here
          </span>
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        {imagePreviews.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {imagePreviews.map((src, i) => (
              <div key={i} className="group relative aspect-square overflow-hidden rounded-md border">
                <img
                  src={src}
                  alt={`Evidence ${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-foreground/70 p-0.5 text-background opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Video</Label>
        {videoPreview ? (
          <div className="relative rounded-lg border overflow-hidden">
            <video
              src={videoPreview}
              className="w-full max-h-[200px] object-cover"
              controls
            />
            <button
              type="button"
              onClick={removeVideo}
              className="absolute right-2 top-2 rounded-full bg-foreground/70 p-1 text-background"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div
            className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-sky/50 hover:bg-sky/5"
            onClick={() => videoInputRef.current?.click()}
          >
            <Video className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Click to upload video
            </span>
          </div>
        )}
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleVideoUpload}
        />
      </div>
    </div>
  );
};

export default EvidenceUploadSection;
