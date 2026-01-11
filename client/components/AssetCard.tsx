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
        <div className="overflow-hidden rounded-lg flex flex-col h-full transition-all duration-300 hover:shadow-xl bg-card border border-border hover:border-border/50">
          {/* Image Section */}
          <div className="relative h-44 overflow-hidden bg-muted">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Price Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1 rounded text-xs font-semibold backdrop-blur-sm ${
                  isFree
                    ? "bg-accent/20 text-accent"
                    : "bg-primary/25 text-primary"
                }`}
              >
                {isFree ? "Free" : `$${asset.price}`}
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 flex flex-col flex-1">
            {/* Name & Category */}
            <div className="mb-3">
              <h3 className="font-semibold text-sm line-clamp-2 text-foreground leading-snug">
                {asset.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 capitalize">
                {asset.category}
              </p>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-xs mb-4 py-2 border-y border-border/40">
              <div className="flex items-center gap-1">
                <Star size={14} className="fill-accent text-accent" />
                <span className="font-semibold text-foreground">
                  {asset.rating.toFixed(1)}
                </span>
                <span className="text-muted-foreground text-xs">
                  ({asset.reviews})
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Download size={14} />
                <span className="text-xs font-medium">{asset.downloads}</span>
              </div>
            </div>

            {/* Author */}
            <div className="text-xs text-muted-foreground mb-3 truncate">
              {asset.authorName}
            </div>

            {/* Action Button */}
            <button
              onClick={handleAction}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded font-medium transition-all duration-200 text-xs mt-auto ${
                isFree
                  ? "bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 hover:border-accent/30"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary"
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
