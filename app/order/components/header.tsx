"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, User, Menu, Search, X, Home, List, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/auth-provider";
import { Card, CardContent } from "@/components/ui/card";

interface HeaderProps {
  cartItems?: number;
  isAuthenticated?: boolean;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onLoginClick?: () => void;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

export function Header({
  cartItems = 0,
  isAuthenticated = false,
  onCartClick = () => {},
  onProfileClick = () => {},
  onLoginClick = () => {},
  updateSelectedBranchId,
  selectedBranchIdPassed,
  onMobileMenuToggle = () => {},
}: any) {

  const { userName, userRole, logout: authLogout } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [loading,setLoading] = useState(true)

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

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

  const [selectedBranchInfo, setSelectedBranchInfo] = useState<{
    name: string;
    address: string;
    phoneNumber: string;
    hours: string;
  } | null>(null);

    useEffect(() => {
    console.log("Component A sees new branch:", selectedBranchIdPassed);
    setSelectedBranchId(selectedBranchIdPassed)
  }, [selectedBranchIdPassed]);

  useEffect(() => {
    // Only fetch restaurant data once
    const fetchRestaurantData = async () => {

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
        setLoading(false)
      } catch (err) {
        console.error("Failed to load restaurant data:", err);
      }
    };

    fetchRestaurantData();
  }, [updateSelectedBranchId]);

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



  // Focus search input when search is shown
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Notify parent component when mobile menu state changes
  useEffect(() => {
    onMobileMenuToggle(mobileMenuOpen);
  }, [mobileMenuOpen, onMobileMenuToggle]);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const handleLoginOrProfile = () => {
    if (isAuthenticated) {
      onProfileClick();
    } else {
      onLoginClick();
    }
  };

  const getAuthToken = useMemo(() => {
    return () => {
      return document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
    };
  }, []);

  const logout = () => {
    // Clear the auth token cookie
    document.cookie =
      "clientAuthToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Remove profile data from localStorage
    const preservedHasSelectedLocation = localStorage.getItem("hasSelectedLocation");
    const preservedBranchId = localStorage.getItem("selectedBranchId");
    
    localStorage.clear();

    // Restore the preserved location
    if (preservedHasSelectedLocation !== null) {
      localStorage.setItem("hasSelectedLocation", preservedHasSelectedLocation);
    }
    if (preservedBranchId !== null) {
      localStorage.setItem("selectedBranchId", preservedBranchId);
    }

    // Close the popup
    setMobileMenuOpen(false);

    // Refresh the page to update the UI state
    window.location.href = "/";
  };

  const home_url = process.env.NEXT_PUBLIC_WEBSITE_URL || ""

  if(!loading)
  return (
    <header className="sticky top-0 z-50 w-full border-b border-navbarbordercolor bg-navbarcolor text-white">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-white"
              >
                <Menu className="h-5 w-5 text-navbartextcolor" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[300px] sm:w-[350px] pr-0 bg-navbarsheetcolor border-r border-gray-800 text-white"
            >
              <div className="pr-4 py-2">
                <Link
                  href={process.env.NEXT_PUBLIC_WEBSITE_URL || "/"}
                  className="flex items-center gap-2 mb-6"
                  target="_blank"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Image
                    src="/TERIYAKI-logo.png"
                    alt="TERIYAKI Logo"
                    width={80}
                    height={30}
                    className="object-contain"
                  />
                </Link>
                {isAuthenticated ? (
                  <div>
                    <nav className="flex flex-col gap-4 mr-5">
                      <Link
                        href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-navbartextcolor font-medium py-2 flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </Link>
                      <Link
                        href="/client/profile"
                        className="text-navbartextcolor font-medium py-2 flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <Link
                        href="/order"
                        className="text-navbartextcolor font-medium py-2 flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Menu className="w-4 h-4" />
                        Menu
                      </Link>
                      <Link
                        href="/client/orders"
                        className="text-navbartextcolor font-medium py-2 flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <List className="w-4 h-4" />
                        My Orders
                      </Link>
                      <Link
                        href="/checkout"
                        className="text-navbartextcolor font-medium py-2 flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Checkout
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={logout}
                        className="rounded-md bg-navbarbordercolor text-white hover:bg-gray-200 border-none mt-4 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </nav>
                  </div>
                ) : (
                  <nav className="flex flex-col gap-4 mr-5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onLoginClick}
                      className="rounded-md bg-white text-navbartextcolor font-semibold border-none flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Login
                    </Button>
                  </nav>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Link href={process.env.NEXT_PUBLIC_WEBSITE_URL || "/"} target="_blank" className="flex items-center gap-2">
            <Image
              src="/TERIYAKI-logo.png"
              alt="TERIYAKI Logo"
              width={80}
              height={35}
              className="object-contain hidden sm:block"
            />
            
            <Image
              src="/TERIYAKI-logo.png"
              alt="TERIYAKI Logo"
              width={80}
              height={25}
              className="object-contain sm:hidden"
            />
          </Link>

        </div>

        <div className="hidden sm:flex items-center gap-4 bg-white p-2 rounded-md border border-navbarbordercolor shadow-sm">
  <label
    htmlFor="header-branch-select"
    className="text-sm font-medium text-gray-700 whitespace-nowrap"
  >
    Select location <span className="text-navbarbordercolor">*</span>
  </label>
  <select
    id="header-branch-select"
    value={selectedBranchId || ""}
    onChange={(e) => {
      const newId = Number(e.target.value);
      setSelectedBranchId(newId);
      localStorage.setItem("selectedBranchId", newId.toString());
      if (updateSelectedBranchId) {
        updateSelectedBranchId(newId);
      }
    }}
    className="text-sm p-2 rounded border border-navbarbordercolor bg-white text-navbartextcolor focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
  >
    {restaurantData.branches.map((branch) => (
      <option key={branch.id} value={branch.id}>
        {branch.name} – {branch.address}
      </option>
    ))}
  </select>
</div>


        <div className="flex items-center gap-4">

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden sm:block"
          >
            <a
              href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-navbartextcolor font-medium"
            >
              Home
            </a>
            
          </motion.div> 

          {/* Login/Profile Button */}
          {isAuthenticated ? (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <div
                className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 hidden sm:flex"
                onClick={onProfileClick}
              >
                <User size={16} className="text-black" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="hidden sm:block"
            >
              <Button
                variant="outline"
                size="sm"
                onClick={onLoginClick}
                className="rounded-md bg-navbartextcolor hover:bg-navbartextcolor/70 hover:text-white text-white border-none"
              >
                Login
              </Button>
            </motion.div>
          )}

          {/* Cart Button */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="primary"
              className="rounded-md flex items-center gap-2 bg-navbartextcolor text-white hover:bg-navbartextcolor/70 px-3 py-2"
              onClick={onCartClick}
            >
              <ShoppingBag size={12} />
              <motion.span
                key={cartItems}
                initial={{ scale: 1.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {cartItems}
              </motion.span>
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="w-full bg-blue-400 px-4 pb-4 pt-2"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="search"
                placeholder="Search..."
                className="pl-10 pr-4 bg-gray-900 border-gray-700 text-white placeholder:text-gray-400 focus:border-blue-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
