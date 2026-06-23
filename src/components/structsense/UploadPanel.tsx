import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react";

interface Props {
  previewUrl: string | null;
  isAnalyzing: boolean;
  onFile: (file: File) => void;
}

export function UploadPanel({ previewUrl, isAnalyzing, onFile }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile],
  );

  return (
    <div className="flex h-full flex-col gap-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group relative flex min-h-[420px] flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-card transition ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {previewUrl ? (
          <div className="relative h-full w-full">
            <img src={previewUrl} alt="Uploaded structure" className="h-full w-full object-contain" />
            {isAnalyzing && (
              <>
                <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px]" />
                <div className="scanline" />
                <div className="absolute inset-x-0 bottom-4 flex justify-center">
                  <div className="flex items-center gap-2 rounded-full bg-card/90 px-4 py-2 text-sm font-medium text-primary">
                    <Loader2 className="size-4 animate-spin" />
                    Analyzing structure…
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-4 px-8 text-center"
          >
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Upload className="size-8" />
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">Drop a structural image</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Beams, columns, slabs, bridge decks — JPG or PNG
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Choose image
            </button>
          </motion.div>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ImageIcon className="size-3.5" />
        Inference runs locally via FastAPI at <code className="text-foreground/80">localhost:8000</code>
      </div>
    </div>
  );
}
