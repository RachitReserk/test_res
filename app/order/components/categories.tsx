"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import Image from "next/image"
import { Plus, Minus, Search, X, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

interface MenuItem {
  id: number
  name: string
  price: string
  image: string | null
  description: string
  tags: number[]
}

interface Subcategory {
  id: number
  name: string
  menu_items: MenuItem[]
}

interface Category {
  id: number
  name: string
  description: string
  subcategories: Subcategory[]
  menu_items: MenuItem[]
  image?: string | null
}

interface MenuCategoriesProps {
  restaurantId?: string
  onItemClick?: (itemId: number) => void
  selectedBranchId?: number | null
}

const DEFAULT_IMAGE = "/spaghetti.jpg"

export default function Categories({ onItemClick, selectedBranchId }: MenuCategoriesProps) {
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [expandedSubcategories, setExpandedSubcategories] = useState<number[]>([])
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [isSticky, setIsSticky] = useState(false)
  const categoriesScrollRef = useRef<HTMLDivElement>(null)
  const categoryRefs = useRef<{ [key: number]: HTMLElement | null }>({})

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = categories
      .map((category) => {
        // Filter subcategories and their items
        const filteredSubcategories = category.subcategories
          .map((subcategory) => ({
            ...subcategory,
            menu_items: subcategory.menu_items.filter(
              (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
            ),
          }))
          .filter((subcategory) => subcategory.menu_items.length > 0)

        // Filter direct menu items
        const filteredMenuItems = category.menu_items.filter(
          (item) => item.name.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
        )

        return {
          ...category,
          subcategories: filteredSubcategories,
          menu_items: filteredMenuItems,
        }
      })
      .filter(
        (category) =>
          category.subcategories.length > 0 ||
          category.menu_items.length > 0 ||
          category.name.toLowerCase().includes(query),
      )

    setFilteredCategories(filtered)
  }, [searchQuery, categories])

  // Handle scroll events to update active category
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + 100 // Offset for header
    setIsSticky(scrollPosition > 100)

    // Find which category section is currently in view
    const categoryIds = Object.keys(categoryRefs.current).map(Number)

    for (let i = categoryIds.length - 1; i >= 0; i--) {
      const categoryId = categoryIds[i]
      const element = categoryRefs.current[categoryId]

      if (element) {
        const rect = element.getBoundingClientRect()
        if (rect.top <= 200) {
          // Category is at or above the threshold
          if (activeCategory !== categoryId) {
            setActiveCategory(categoryId)

            // Scroll the category nav to make active category visible
            setTimeout(() => {
              if (categoriesScrollRef.current) {
                const navElement = categoriesScrollRef.current.querySelector(`[data-category-id="${categoryId}"]`)
                if (navElement) {
                  const navRect = navElement.getBoundingClientRect()
                  const scrollRect = categoriesScrollRef.current.getBoundingClientRect()

                  // Calculate if the element is outside the visible area
                  if (navRect.left < scrollRect.left || navRect.right > scrollRect.right) {
                    // Calculate the scroll position to center the element
                    const scrollLeft = navElement.offsetLeft - scrollRect.width / 2 + navRect.width / 2
                    categoriesScrollRef.current.scrollTo({
                      left: scrollLeft,
                      behavior: "smooth",
                    })
                  }
                }
              }
            }, 10)
          }
          break
        }
      }
    }
  }, [activeCategory])

  useEffect(() => {
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => {
    const container = categoriesScrollRef.current
    if (!container) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      container.scrollBy({ left: e.deltaY || e.deltaX, behavior: "smooth" })
    }
    container.addEventListener("wheel", handler, { passive: false })
    return () => container.removeEventListener("wheel", handler)
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      if (!selectedBranchId) return
      setIsLoading(true)
      console.log("Selected Branch Id = +" + selectedBranchId)
      const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/customer/menu/?branch_id=${selectedBranchId}&restaurant=${restaurantId}`
      try {
        const response = await fetch(API_URL)
        const json = await response.json()

        if (!response.ok || json.status !== "success") throw new Error("Failed to load menu")

        const formatted = json.categories
          .map((cat: any) => ({
            ...cat,
            image: cat.image || DEFAULT_IMAGE,
            subcategories: Array.isArray(cat.subcategories) ? cat.subcategories : [],
            menu_items: Array.isArray(cat.menu_items)
              ? cat.menu_items.sort((a: any, b: any) => a.display_order - b.display_order)
              : [],
          }))
          .sort((a: any, b: any) => a.display_order - b.display_order)

        setCategories(formatted)

        if (formatted.length > 0) {
          setActiveCategory(formatted[0].id)

          const allCategoryIds = formatted.map((cat: Category) => cat.id)
          setExpandedCategories(allCategoryIds)

          const allSubcategoryIds: number[] = []
          formatted.forEach((category: Category) => {
            category.subcategories.forEach((subcategory) => {
              allSubcategoryIds.push(subcategory.id)
            })
          })
          setExpandedSubcategories(allSubcategoryIds)
        }
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [restaurantId, selectedBranchId])

  const handleCategoryClick = (categoryId: number) => {
    // Find the category element and scroll to it
    const element = categoryRefs.current[categoryId]
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100, // Offset for header
        behavior: "smooth",
      })
    }
  }

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  const toggleSubcategory = (subcategoryId: number) => {
    setExpandedSubcategories((prev) =>
      prev.includes(subcategoryId) ? prev.filter((id) => id !== subcategoryId) : [...prev, subcategoryId],
    )
  }

  const clearSearch = () => {
    setSearchQuery("")
  }

  const expandAllCategories = () => {
    const allCategoryIds = filteredCategories.map((cat) => cat.id)
    setExpandedCategories(allCategoryIds)

    const allSubcategoryIds: number[] = []
    filteredCategories.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        allSubcategoryIds.push(subcategory.id)
      })
    })
    setExpandedSubcategories(allSubcategoryIds)
  }

  const collapseAllCategories = () => {
    setExpandedCategories([])
    setExpandedSubcategories([])
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] mb-[50px]">
        <div className="w-12 h-12 rounded-full border-4 border-orange-200 border-t-navbartextcolor animate-spin"></div>
        <p className="mt-4 text-navbartextcolor font-medium">Loading menu...</p>
      </div>
    )
  }

  if (!selectedBranchId) {
    return (
      <div className="w-full py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500">Please select a branch to view the menu</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 bg-backgroundcategory">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-gray-800">Our Menu</h2>
          <Badge variant="outline" className="bg-navbarcolor text-navbartextcolor border-navbarbordercolor">
            {filteredCategories.length} Categories
          </Badge>
        </div>

        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type=""
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 bg-white border-gray-300 focus:border-navbartextcolor focus:ring-navbartextcolor"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={expandAllCategories} className="text-sm bg-transparent">
              <ChevronDown className="h-4 w-4 mr-1" />
              Expand All
            </Button>
            <Button variant="outline" size="sm" onClick={collapseAllCategories} className="text-sm bg-transparent">
              <ChevronUp className="h-4 w-4 mr-1" />
              Collapse All
            </Button>
          </div>

          {searchQuery && (
            <div className="text-sm text-gray-600">
              {filteredCategories.reduce(
                (total, cat) =>
                  total +
                  cat.menu_items.length +
                  cat.subcategories.reduce((subTotal, sub) => subTotal + sub.menu_items.length, 0),
                0,
              )}{" "}
              items found for "{searchQuery}"
            </div>
          )}
        </div>

        {/* Category Navigation - only show when not searching */}
        {!searchQuery && (
          <div
            className={cn(
              "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200",
              isSticky ? "sticky top-16 z-40 py-2 border-b" : "py-2",
            )}
          >
            <div ref={categoriesScrollRef} className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-4 min-w-max pb-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    data-category-id={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={cn(
                      "whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2",
                      activeCategory === category.id
                        ? "bg-navbartextcolor text-primary-foreground"
                        : "hover:bg-navbartextcolor hover:text-primary-foreground",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {/* Render all categories and their items */}
          {filteredCategories.map((category) => (
            <section
              key={category.id}
              id={`category-${category.id}`}
              className="scroll-mt-24"
              ref={(el) => {
                categoryRefs.current[category.id] = el
              }}
            >
              <div className="flex items-center justify-between mb-4 p-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-2xl font-bold text-gray-800">{category.name}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleCategory(category.id)}
                  className="h-8 px-2 text-gray-600 hover:text-gray-800"
                >
                  {expandedCategories.includes(category.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </Button>
              </div>

              <AnimatePresence>
                {expandedCategories.includes(category.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Render subcategories if they exist */}
                    {category.subcategories.length > 0 ? (
                      <div className="space-y-8">
                        {category.subcategories.map((subcategory) => (
                          <div key={subcategory.id}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-xl font-bold">{subcategory.name}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleSubcategory(subcategory.id)}
                                className="h-8 px-2"
                              >
                                {expandedSubcategories.includes(subcategory.id) ? (
                                  <Minus size={16} />
                                ) : (
                                  <Plus size={16} />
                                )}
                              </Button>
                            </div>

                            <AnimatePresence>
                              {expandedSubcategories.includes(subcategory.id) && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {subcategory.menu_items.map((item) => (
                                      <Card
                                        key={item.id}
                                        className="overflow-hidden h-full transition-all hover:shadow-md"
                                      >
                                        <CardContent className="p-0">
                                          <div className="flex flex-col h-full">
                                            <div className="flex p-4 flex-1 gap-3">
                                              <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-base mb-1 truncate">{item.name}</h3>
                                                {item.description && (
                                                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                                    {item.description}
                                                  </p>
                                                )}
                                                <p className="font-medium">${item.price}</p>
                                              </div>
                                              {item.image && (
                                                <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                                  <img
                                                    src={item.image || DEFAULT_IMAGE}
                                                    alt={item.name}
                                                    className="object-cover"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                            <Button
                                              variant="ghost"
                                              className="rounded-none border-t h-10 flex items-center justify-center gap-1 hover:bg-muted"
                                              onClick={() => onItemClick?.(item.id)}
                                            >
                                              <Plus className="h-4 w-4" />
                                              <span>Add to Order</span>
                                            </Button>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Render direct menu items if no subcategories
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.menu_items.map((item) => (
                          <Card key={item.id} className="overflow-hidden h-full transition-all hover:shadow-md">
                            <CardContent className="p-0">
                              <div className="flex flex-col h-full">
                                <div className="flex p-4 flex-1 gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-base mb-1 truncate">{item.name}</h3>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                        {item.description}
                                      </p>
                                    )}
                                    <p className="font-medium">${item.price}</p>
                                  </div>
                                  {item.image && (
                                    <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                                      <Image
                                        src={item.image || DEFAULT_IMAGE}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  className="rounded-none border-t h-10 flex items-center justify-center gap-1 hover:bg-muted"
                                  onClick={() => onItemClick?.(item.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                  <span>Add to Order</span>
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          ))}
        </div>

        {searchQuery && filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500">Try searching with different keywords or browse our categories above.</p>
            <Button variant="outline" onClick={clearSearch} className="mt-4 bg-transparent">
              Clear search
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
