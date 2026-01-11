import { useState, useEffect } from "react";
import {
  X,
  Download,
  FileText,
  Archive,
  Code,
  Image as ImageIcon,
  Music,
  Film,
} from "lucide-react";
import {
  listAssetFiles,
  formatFileSize,
  type AssetFile,
} from "@/lib/fileService";

interface FilePreviewModalProps {
  assetId: string;
  assetName: string;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (selectedFiles: AssetFile[]) => Promise<void>;
  isDownloading?: boolean;
}

export function FilePreviewModal({
  assetId,
  assetName,
  isOpen,
  onClose,
  onDownload,
  isDownloading = false,
}: FilePreviewModalProps) {
  const [files, setFiles] = useState<AssetFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchFiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const assetFiles = await listAssetFiles(assetId);

        if (assetFiles.length === 0) {
          setError("No files available for download");
        } else {
          setFiles(assetFiles);
          // Select all files by default
          setSelectedFiles(new Set(assetFiles.map((f) => f.path)));
        }
      } catch (err: any) {
        console.error("Error fetching files:", err);
        const errorCode = err?.code || "unknown";

        // Provide helpful error message
        if (errorCode === "storage/unauthorized") {
          setError(
            "Access denied. Firebase Storage rules may not be configured.",
          );
        } else if (errorCode === "storage/object-not-found") {
          setError("No files found for this asset. Upload files first.");
        } else {
          setError("Failed to load files. Check console for details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [assetId, isOpen]);

  const toggleFileSelection = (filePath: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filePath)) {
      newSelected.delete(filePath);
    } else {
      newSelected.add(filePath);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map((f) => f.path)));
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon size={18} className="text-blue-400" />;
      case "archive":
        return <Archive size={18} className="text-yellow-400" />;
      case "code":
        return <Code size={18} className="text-green-400" />;
      case "document":
        return <FileText size={18} className="text-red-400" />;
      case "video":
        return <Film size={18} className="text-purple-400" />;
      case "audio":
        return <Music size={18} className="text-orange-400" />;
      default:
        return <FileText size={18} className="text-gray-400" />;
    }
  };

  const selectedFilesList = files.filter((f) => selectedFiles.has(f.path));

  const handleDownload = async () => {
    if (selectedFilesList.length === 0) {
      return;
    }
    await onDownload(selectedFilesList);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Download Files
            </h2>
            <p className="text-sm text-muted-foreground mt-1">{assetName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-muted-foreground">
                  Loading files...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All */}
              <div className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg mb-4">
                <input
                  type="checkbox"
                  id="select-all"
                  checked={
                    selectedFiles.size === files.length && files.length > 0
                  }
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label
                  htmlFor="select-all"
                  className="flex-1 cursor-pointer text-sm font-medium"
                >
                  Select All ({selectedFiles.size}/{files.length})
                </label>
              </div>

              {/* File List */}
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-3 p-3 border border-border/30 rounded-lg hover:bg-secondary/30 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.path)}
                    onChange={() => toggleFileSelection(file.path)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!error && (
          <div className="flex items-center justify-between gap-3 p-6 border-t border-border bg-secondary/20">
            <p className="text-sm text-muted-foreground">
              {selectedFilesList.length} file
              {selectedFilesList.length !== 1 ? "s" : ""} selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-secondary border border-border/30 hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDownload}
                disabled={selectedFilesList.length === 0 || isDownloading}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                <Download size={16} />
                {isDownloading
                  ? "Downloading..."
                  : `Download (${selectedFilesList.length})`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
