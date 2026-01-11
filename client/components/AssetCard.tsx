import { Link } from "react-router-dom";
import { Star, Download, Lock } from "lucide-react";
import type { Asset } from "@/lib/assetService";

interface AssetCardProps {
  asset: Asset;
  onPurchaseClick?: (asset: Asset) => void;
}

export function AssetCard({ asset, onPurchaseClick }: AssetCardProps) {
  const isFree = asset.price === null || asset.price === 0;

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isFree && onPurchaseClick) {
      // For paid assets, trigger purchase modal
      onPurchaseClick(asset);
    } else {
      // For free assets, navigate to detail page with preview
      window.location.href = `/asset/${asset.id}?preview=true`;
    }
  };

  return (
    <Link to={`/asset/${asset.id}`}>
      <div className="group h-full">
        <div className="overflow-hidden border border-white/5 rounded-lg flex flex-col h-full transition-all duration-300 hover:border-white/15 hover:shadow-lg bg-white/[0.02] hover:bg-white/[0.04]">
          {/* Image Section */}
          <div className="relative h-44 overflow-hidden bg-white/5">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1.5 rounded-md text-xs font-medium backdrop-blur-md transition-all ${
                  isFree
                    ? "bg-white/15 text-foreground/90"
                    : "bg-primary/25 text-primary/95"
                }`}
              >
                {isFree ? "Free" : `$${asset.price}`}
              </span>
            </div>

            {/* Type Badge */}
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-white/15 backdrop-blur-md text-foreground/80 capitalize">
                {asset.type}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 flex flex-col flex-1">
            {/* Name */}
            <div className="flex-1 mb-4">
              <h3 className="font-medium text-sm line-clamp-2 text-foreground/95 leading-snug">
                {asset.name}
              </h3>
              <p className="text-xs text-muted-foreground/70 mt-2 capitalize">
                {asset.category}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3 mb-3">
              <div className="flex items-center gap-1.5">
                <Star size={12} className="fill-primary/60 text-primary/60" />
                <span className="font-medium text-foreground/85 text-xs">
                  {asset.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground/60 text-xs">
                  ({asset.reviews})
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground/60">
                <Download size={12} />
                <span className="text-xs">{asset.downloads}</span>
              </div>
            </div>

            {/* Author */}
            <div className="flex items-center gap-2 border-t border-white/5 pt-3 mb-4">
              <p className="text-xs text-muted-foreground/70 truncate flex-1">
                {asset.authorName}
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={isFree ? handleDownload : (e) => e.preventDefault()}
              className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all duration-200 text-xs ${
                isFree
                  ? "bg-white/8 border border-white/10 text-foreground/80 hover:bg-white/12 hover:border-white/15"
                  : "bg-primary/20 text-primary/95 border border-primary/20 hover:bg-primary/25 hover:border-primary/30"
              }`}
            >
              {isFree ? (
                <>
                  <Download size={14} />
                  Download
                </>
              ) : (
                <>
                  <Lock size={14} />
                  Get Access
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
