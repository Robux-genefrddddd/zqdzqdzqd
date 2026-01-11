import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AssetCard } from "@/components/AssetCard";
import { PurchaseCheckoutModal } from "@/components/PurchaseCheckoutModal";
import {
  Search,
  X,
  Box,
  Palette,
  Code,
  Zap,
  Music,
  Image as ImageIcon,
  MoreHorizontal,
  LayoutGrid,
} from "lucide-react";
import { getPublishedAssets, type Asset } from "@/lib/assetService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";

const CATEGORIES = [
  { name: "3D Models", icon: Box },
  { name: "UI Design", icon: Palette },
  { name: "Scripts", icon: Code },
  { name: "Animations", icon: Zap },
  { name: "Plugins", icon: LayoutGrid },
  { name: "Sounds", icon: Music },
  { name: "Images", icon: ImageIcon },
  { name: "Other", icon: MoreHorizontal },
];

export default function Marketplace() {
  const [allAssets, setAllAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch assets from Firebase
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const assets = await getPublishedAssets(selectedCategory, 100);
        setAllAssets(assets);
      } catch (error) {
        console.error("Error fetching assets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [selectedCategory]);

  // Filter and sort assets
  const filteredAssets = allAssets
    .filter((asset) => {
      if (!searchQuery) return true;
      return (
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.downloads - a.downloads;
        case "rating":
          return b.rating - a.rating;
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        default: // newest
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

  if (loading) {
    return <Loader text="Loading assets..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-10 md:py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
          <p className="text-sm text-muted-foreground">
            Discover and download high-quality digital assets for your projects
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-10">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60"
              size={18}
            />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-base pl-10 pr-4"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:text-foreground transition-colors"
              >
                <X size={18} className="text-muted-foreground/60" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <aside
            className={`${
              mobileFiltersOpen ? "block" : "hidden"
            } md:block w-full md:w-[200px] flex-shrink-0`}
          >
            <div className="sticky top-20 space-y-8">
              {/* Category Filter */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 mb-4">
                  Category
                </h3>
                <div className="space-y-2">
                  {/* All Categories */}
                  <button
                    onClick={() => setSelectedCategory(undefined)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 border-l-2 ${
                      !selectedCategory
                        ? "border-l-primary text-foreground bg-white/5 hover:bg-white/8"
                        : "border-l-transparent text-muted-foreground/80 hover:text-foreground hover:bg-white/5"
                    }`}
                  >
                    <LayoutGrid size={16} className="flex-shrink-0" />
                    <span>All</span>
                  </button>

                  {/* Category Items */}
                  {CATEGORIES.map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      onClick={() => setSelectedCategory(name)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 border-l-2 ${
                        selectedCategory === name
                          ? "border-l-primary text-foreground bg-white/5 hover:bg-white/8"
                          : "border-l-transparent text-muted-foreground/80 hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0" />
                      <span className="truncate">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/80 mb-4">
                  Sort By
                </h3>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="bg-white/5 border-white/10 hover:border-white/15">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="price-low">
                      Price: Low to High
                    </SelectItem>
                    <SelectItem value="price-high">
                      Price: High to Low
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Close Mobile Filters */}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="md:hidden w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm"
              >
                Done
              </button>
            </div>
          </aside>

          {/* Assets Grid */}
          <main className="flex-1">
            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="md:hidden mb-8 px-4 py-2 bg-white/5 border border-white/10 rounded-lg font-medium text-sm w-full hover:bg-white/8 transition-colors"
            >
              Filters & Sort
            </button>

            {filteredAssets.length === 0 ? (
              <div className="border border-white/5 rounded-lg p-16 text-center space-y-3 bg-white/2">
                <p className="text-base font-medium text-foreground/80">
                  No assets found
                </p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <>
                <div className="mb-8 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground/80">
                    Showing {filteredAssets.length}{" "}
                    {filteredAssets.length === 1 ? "asset" : "assets"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
