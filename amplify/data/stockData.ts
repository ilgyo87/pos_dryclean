// src/screens/Products/data/stockData.ts
import type { Schema } from "../../amplify/data/resource";

export interface StockCategory {
  name: string;
  description: string;
  price?: number;
  imageUrl?: string;
}

export interface StockItem {
  name: string;
  description: string;
  price: number;
  duration?: number;
  imageSource?: string;
  starch?: 'NONE' | 'LIGHT' | 'MEDIUM' | 'HEAVY';
  pressOnly?: boolean;
  imageUrl?: string;
}

export const DEFAULT_CATEGORIES: StockCategory[] = [
  {
    name: "Dry Cleaning",
    description: "Standard dry cleaning services for various garments",
    price: 5
  },
  {
    name: "Washing",
    description: "Professional washing and pressing of shirts",
    price: 2.5
  },
  {
    name: "Alterations",
    description: "Garment alterations and repairs",
    price: 10
  },
  {
    name: "Household Items",
    description: "Cleaning services for household textiles and items",
    price: 20
  },
  {
    name: "Specialty Cleaning",
    description: "Specialized cleaning for delicate or unique items",
    price: 10
  },
];

export const DEFAULT_ITEMS: Record<string, StockItem[]> = {
  "Dry Cleaning": [
    {
      name: "Pants/Slacks",
      description: "Dry cleaning for pants or slacks",
      price: 5,
      duration: 3,
      imageSource: "trousers"
    },
    {
      name: "Men's Suit (2pc)",
      description: "Dry cleaning for a two-piece men's suit",
      price: 10,
      duration: 3,
      imageSource: "groom-suit"
    },
    {
      name: "Skirt",
      description: "Dry cleaning for skirts",
      price: 5,
      duration: 3,
      imageSource: "skirt"
    },
    {
      name: "Dress",
      description: "Standard dry cleaning for dresses",
      price: 10,
      duration: 3,
      imageSource: "dress"
    },
    {
      name: "Blazer/Sport Coat",
      description: "Dry cleaning for blazers or sport coats",
      price: 5,
      duration: 3,
      imageSource: "blazer"
    },
    {
      name: "Polo Shirt",
      description: "Dry cleaning for polo shirts",
      price: 5,
      duration: 3,
      imageSource: "polo"
    },
    {
      name: "Dress Shirt",
      description: "Dry cleaning for dress shirts",
      price: 5,
      duration: 3,
      imageSource: "dress-shirt"
    },
    {
      name: "Jacket",
      description: "Dry cleaning for jackets",
      price: 10,
      duration: 3,
      imageSource: "jacket"
    },
    {
      name: "Coat",
      description: "Dry cleaning for coats",
      price: 10,
      duration: 3,
      imageSource: "winter_coat"
    },
    {
      name: "Sari",
      description: "Dry cleaning for saris",
      price: 10,
      duration: 3,
      imageSource: "sari"
    },
    {
      name: "Jersey",
      description: "Dry cleaning for jerseys",
      price: 5,
      duration: 3,
      imageSource: "jersey"
    },
    {
      name: "Kids Clothing",
      description: "Dry cleaning for kids clothing",
      price: 5,
      duration: 3,
      imageSource: "kids_clothes"
    }
  ],
  "Washing": [
    {
      name: "Dress Shirt",
      description: "Laundering and pressing for dress shirts",
      price: 2.5,
      duration: 3,
      imageSource: "dress-shirt",
    },
    {
      name: "Boxed Shirt",
      description: "Laundering with fold service",
      price: 3,
      duration: 3,
      imageSource: "box_clothes"
    },
    {
      name: "Pants/Slacks",
      description: "Laundering and pressing for pants or slacks",
      price: 2.5,
      duration: 3,
      imageSource: "jeans"
    }
  ],
  "Household Items": [
    {
      name: "Comforter (Queen/King)",
      description: "Cleaning for queen or king size comforters",
      price: 20,
      duration: 5,
      imageSource: "blanket"
    },
    {
      name: "Blanket",
      description: "Cleaning for standard blankets",
      price: 10,
      duration: 5,
      imageSource: "towel"
    },
    {
      name: "Pillow",
      description: "Cleaning for pillows",
      price: 5,
      duration: 5,
      imageSource: "pillow"
    },
    {
      name: "Curtains (per panel)",
      description: "Cleaning for curtain panels",
      price: 10,
      duration: 5,
      imageSource: "curtain"
    },
    {
      name: "Area Rug (small)",
      description: "Cleaning for small area rugs",
      price: 10,
      duration: 5,
      imageSource: "rug"
    }
  ],
  "Specialty Cleaning": [
    {
      name: "Wedding Dress",
      description: "Specialized cleaning for wedding dresses",
      price: 100,
      duration: 5,
      imageSource: "wedding-dress"
    },
    {
      name: "Leather/Suede Item",
      description: "Specialized cleaning for leather or suede items",
      price: 50,
      duration: 5,
      imageSource: "leather-jacket"
    },
    {
      name: "Shoes",
      description: "Specialized cleaning for shoes",
      price: 20,
      duration: 5,
      imageSource: "shoes"
    }
  ],
  "Alterations": [
    {
      name: "Hem Pants",
      description: "Standard hemming for pants",
      price: 10,
      duration: 5,
      imageSource: "hem_cut"
    },
    {
      name: "Replace Zipper",
      description: "Zipper replacement service",
      price: 10,
      duration: 5,
      imageSource: "zipper"
    },
    {
      name: "Take in Waist",
      description: "Alter waistline of pants or skirts",
      price: 10,
      duration: 5,
      imageSource: "waist"
    }
  ]
};

// This function helps create a service and its products in the database
export const loadStockService = async (
  createService: (data: any) => Promise<any>,
  createProduct: (data: any) => Promise<any>,
  userId: string,
  serviceName: string
): Promise<void> => {
  try {
    // Find the category in our stock data
    const categoryData = DEFAULT_CATEGORIES.find(c => c.name === serviceName);
    if (!categoryData) {
      console.error(`Service "${serviceName}" not found in stock data`);
      return;
    }
    
    // Create the service
    const newService = await createService({
      ...categoryData,
      userId
    });
    
    if (!newService || !newService.id) {
      console.error('Failed to create service or service ID is missing');
      return;
    }
    
    // Find the items for this category
    const items = DEFAULT_ITEMS[serviceName];
    if (!items || items.length === 0) {
      console.warn(`No items found for service "${serviceName}"`);
      return;
    }
    
    // Create each item, always assigning the correct categoryId
    for (const item of items) {
      await createProduct({
        ...item,
        // Explicitly set categoryId to the new service's id, overriding any existing value
        categoryId: newService.id
      });
    }
    
    console.log(`Successfully loaded service "${serviceName}" with ${items.length} products`);
  } catch (error) {
    console.error(`Error loading stock service "${serviceName}":`, error);
    throw error;
  }
};

// This function loads all stock services and their products
export const loadAllStockData = async (
  createService: (data: any) => Promise<any>,
  createProduct: (data: any) => Promise<any>,
  userId: string
): Promise<void> => {
  try {
    for (const category of DEFAULT_CATEGORIES) {
      await loadStockService(createService, createProduct, userId, category.name);
    }
    console.log('Successfully loaded all stock data');
  } catch (error) {
    console.error('Error loading all stock data:', error);
    throw error;
  }
};