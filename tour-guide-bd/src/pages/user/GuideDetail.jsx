import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useGuideDetail } from "@/hooks/guide/useGuide";
import { Star, MapPin, Globe, Phone, Package, BookOpen, MessageSquare } from "lucide-react";
import PackageCard from "@/components/guide/PackageCard";
import BookingModal from "@/components/guide/BookingModal";
import ReviewSection from "@/components/guide/ReviewSection";

export default function GuideDetail() {
  const { guideId } = useParams();
  const { data: guide, isLoading } = useGuideDetail(guideId);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [activeTab, setActiveTab] = useState("packages");

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!guide) return <p className="text-center py-20 text-gray-400">Guide not found</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-500" />
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
            <img
              src={guide.profilePhotoUrl || "/avatar-placeholder.png"}
              alt={guide.fullName}
              className="w-24 h-24 rounded-2xl border-4 border-white shadow-md object-cover"
            />
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-bold text-gray-800">{guide.fullName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {guide.districtName}
                </span>
                <span className="flex items-center gap-1">
                  <Globe size={13} /> {guide.spokenLanguages?.join(", ")}
                </span>
                <span className="flex items-center gap-1">
                  <Star size={13} className="text-yellow-500" fill="currentColor" />
                  {guide.averageRating?.toFixed(1)} ({guide.totalReviews} reviews)
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Experience</p>
              <p className="text-lg font-bold text-green-600">{guide.yearsOfExperience} Years</p>
            </div>
          </div>

          {/* Bio */}
          {guide.bio && (
            <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4">
              {guide.bio}
            </p>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: "Total Packages", value: guide.packageCount || 0, icon: Package },
              { label: "Total Bookings", value: guide.totalBookings || 0, icon: BookOpen },
              { label: "Reviews", value: guide.totalReviews || 0, icon: MessageSquare },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <Icon size={18} className="mx-auto text-green-600 mb-1" />
                <p className="text-lg font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
        {["packages", "reviews"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <div>
          {guide.packages?.length === 0 ? (
            <p className="text-center text-gray-400 py-12">No packages available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guide.packages?.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  guideView={false}
                  onBook={() => setSelectedPackage(pkg)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === "reviews" && (
        <ReviewSection guideId={guideId} reviews={guide.reviews || []} />
      )}

      {/* Booking Modal */}
      {selectedPackage && (
        <BookingModal
          pkg={selectedPackage}
          guide={guide}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </div>
  );
}