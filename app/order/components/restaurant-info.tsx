"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, Phone, Star, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RestaurantInfoProps {
  isAuthenticated?: boolean;
  setLoginPopupOpen?: (open: boolean) => void;
  setCartOpen?: (open: boolean) => void;
  onOrderClick?: () => void;
  updateSelectedBranchId?: (branchId: number) => void;
}

export function RestaurantInfo({
  isAuthenticated = false,
  setLoginPopupOpen = () => {},
  setCartOpen = () => {},
  onOrderClick,
  updateSelectedBranchId,
  selectedBranchIdPassed
}: any) {
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [selectedBranchInfo, setSelectedBranchInfo] = useState<{
    name: string;
    address: string;
    phoneNumber: string;
    hours: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [restaurantData, setRestaurantData] = useState<{
    name: string;
    tagline: string;
    branches: {
      id: number;
      name: string;
      address: string;
      phoneNumber: string;
      hours: string;
    }[];
  } | null>(null);

  // Use a ref to track if we've already initialized the branch ID
  const [hasInitializedBranchId, setHasInitializedBranchId] = useState(false);
  const [landingImage, setLandingImage] = useState<string>("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const DESCRIPTION_MAX_LENGTH = 150; // Approximate character limit for 2 lines

    useEffect(() => {
    console.log("Component A sees new branch:", selectedBranchIdPassed);
    setSelectedBranchId(selectedBranchIdPassed)
  }, [selectedBranchIdPassed]);

  useEffect(() => {
    // Only fetch restaurant data once
    const fetchRestaurantData = async () => {
      setLoading(true);
      setError(null);

      try {
        const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID || "4";

        let data;
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/customer/restaurant-info?restaurant=${restaurantId}`
          );
          if (!res.ok) {
            throw new Error(`API returned status code ${res.status}`);
          }
          data = await res.json();
          const image = data?.restaurant?.landing_image || null;

          const fallbackImage = "/hero-tkbowl.jpg";

          const bannerImage = image?.startsWith("http")
            ? image
            : image
            ? `https://api.quickbitenow.com${landingImage}`
            : fallbackImage;

          setLandingImage(bannerImage)
          console.log("Fetched restaurant data:", data, image);
        } catch (error) {
          console.error("API call failed, using fallback data:", error);
        }

        const restaurant = data?.restaurant;
        const branches = data?.branches || [];
        const firstBranch = branches[0];

        if (!restaurant || branches.length === 0) {
          throw new Error("Invalid data format received from API");
        }

        const formattedBranches = branches.map((b: any) => ({
          id: b.id,
          name: b.name,
          address: b.address,
          phoneNumber: b.phone_number || "N/A",
          hours: `${b.opening_time?.slice(0, 5) || "00:00"} - ${
            b.closing_time?.slice(0, 5) || "00:00"
          }`,
        }));

        setRestaurantData({
          name: restaurant?.name,
          tagline: restaurant?.description,
          branches: formattedBranches,
        });

        const savedBranchId = localStorage.getItem("selectedBranchId");
        const initialBranchId = savedBranchId
          ? Number(savedBranchId)
          : firstBranch?.id;

        setSelectedBranchId(initialBranchId);
        localStorage.setItem("selectedBranchId", String(initialBranchId));

        // Call the updateSelectedBranchId function to update the parent component
        if (updateSelectedBranchId && initialBranchId) {
          updateSelectedBranchId(initialBranchId);
          setHasInitializedBranchId(true);
        }

        const initialBranch = formattedBranches.find(
          (b: any) => b.id === initialBranchId
        );
        if (initialBranch) {
          setSelectedBranchInfo({
            name: initialBranch.name,
            address: initialBranch.address,
            phoneNumber: initialBranch.phoneNumber,
            hours: initialBranch.hours,
          });
        }
      } catch (err) {
        console.error("Failed to load restaurant data:", err);
        setError(
          "Failed to load restaurant information. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [updateSelectedBranchId]);

  // Add a new effect to listen for changes to the selectedBranchId prop
  useEffect(() => {
    if (updateSelectedBranchId) {
      // Check for branch ID in localStorage
      const savedBranchId = localStorage.getItem("selectedBranchId")
      if (savedBranchId) {
        const branchId = Number(savedBranchId)
        setSelectedBranchId(branchId)

        // Update branch info if restaurant data is available
        if (restaurantData) {
          const selectedBranch = restaurantData.branches.find((branch) => branch.id === branchId)
          if (selectedBranch) {
            setSelectedBranchInfo({
              name: selectedBranch.name,
              address: selectedBranch.address,
              phoneNumber: selectedBranch.phoneNumber,
              hours: selectedBranch.hours,
            })
          }
        }
      }
    }
  }, [updateSelectedBranchId, restaurantData])

  // Update selected branch info when changed
  useEffect(() => {
    if (restaurantData && selectedBranchId) {
      const selectedBranch = restaurantData.branches.find(
        (branch) => branch.id === selectedBranchId
      );
      if (selectedBranch) {
        setSelectedBranchInfo({
          name: selectedBranch.name,
          address: selectedBranch.address,
          phoneNumber: selectedBranch.phoneNumber,
          hours: selectedBranch.hours,
        });
      }
    }
  }, [selectedBranchId, restaurantData]);

  const handleOrderClick = () => {
    if (!isAuthenticated && setLoginPopupOpen) {
      setLoginPopupOpen(true);
    } else if (setCartOpen) {
      setCartOpen(true);
    }

    if (onOrderClick) {
      onOrderClick();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="w-full h-40 bg-gray-200 rounded-md"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!restaurantData || !selectedBranchInfo) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative w-full h-40 overflow-hidden rounded-md">
            <Image
              src={landingImage || "/placeholder-1.webp"}
              alt={restaurantData.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold">{restaurantData.name}</h2>
            <p
              className={cn(
                "text-sm text-muted-foreground mt-1",
                !showFullDescription && "line-clamp-2"
              )}
            >
              {restaurantData.tagline}
            </p>
            {restaurantData.tagline &&
              restaurantData.tagline.length > DESCRIPTION_MAX_LENGTH && (
                <Button
                  variant="link"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="p-0 h-auto text-xs text-blue-600 hover:no-underline"
                >
                  {showFullDescription ? "View Less" : "View More"}
                </Button>
              )}
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <span>{selectedBranchInfo.phoneNumber}</span>
                <a
                  href={`tel:${selectedBranchInfo.phoneNumber.replace(
                    /[^0-9]/g,
                    ""
                  )}`}
                  className="text-getdirectioncall text-sm font-medium ml-2 inline-block hover:underline"
                >
                  Call now
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <span>{selectedBranchInfo.address}</span>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    selectedBranchInfo.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-getdirectioncall text-sm font-medium ml-2 inline-block hover:underline"
                >
                  Get directions
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="font-medium">Opening Hours</div>
                <div>{selectedBranchInfo.hours}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full lg:w-auto"
      >
        <Card className="border-navbarbordercolor shadow-sm">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold mb-4">Start your order</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select location <span className="text-navbarbordercolor">*</span>
                </label>
                <select
                  value={selectedBranchId || ""}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    console.log(newId);
                    setSelectedBranchId(newId);
                    localStorage.setItem("selectedBranchId", newId.toString());
                    if (updateSelectedBranchId) {
                      updateSelectedBranchId(newId);
                    }
                  }}
                  className="w-full p-3 border border-navbarbordercolor rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300"
                >
                  {restaurantData.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name} – {branch.address}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-sm text-gray-500">
                  <p>Hours: {selectedBranchInfo.hours}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
