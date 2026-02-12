export interface MenuItem {
  id: number
  name: string
  category: number
  subcategory: number | null
  description: string
  price: number
  is_active: boolean
  is_featured: boolean
  preparation_time: number
  calories: number
  display_order: number
  variations?: Variation[]
  option_groups?: OptionGroup[]
  tags?: MenuItemTag[]
  image?: string
  image_url?: string
}

export interface Category {
  id: number
  name: string
}

export interface Subcategory {
  id: number
  name: string
  category: number
}

export interface MenuItemTag {
  id: number
  name: string
  description: string
}

export interface Variation {
  id?: number
  name: string
  price_adjustment: number | string
  is_active: boolean
}

export interface Option {
  id?: number
  name: string
  price_adjustment: number | string
  is_active: boolean
}

export interface OptionGroup {
  id?: number
  name: string
  is_required: boolean
  min_selections: number | string
  max_selections: number | string
  options: Option[]
}
