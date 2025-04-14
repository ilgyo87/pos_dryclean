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
  taxable: boolean;
  imageUrl?: string;
}

export const DEFAULT_CATEGORIES: StockCategory[] = [
  {
    name: "Dry Cleaning",
    description: "Standard dry cleaning services for various garments",
    imageUrl: "dry-cleaning.png"
  },
  {
    name: "Laundered Shirts",
    description: "Professional cleaning and pressing of shirts",
    imageUrl: "shirt-cleaning.png"
  },
  {
    name: "Household Items",
    description: "Cleaning services for household textiles and items",
    imageUrl: "household-cleaning.png"
  },
  {
    name: "Specialty Cleaning",
    description: "Specialized cleaning for delicate or unique items",
    imageUrl: "specialty-cleaning.png"
  },
  {
    name: "Alterations",
    description: "Garment alterations and repairs",
    imageUrl: "alterations.png"
  }
];

export const DEFAULT_ITEMS: Record<string, StockItem[]> = {
  "Dry Cleaning": [
    {
      name: "Men's Suit (2pc)",
      description: "Dry cleaning for a two-piece men's suit",
      price: 15.99,
      duration: 60,
      taxable: true,
      imageUrl: "mens-suit.png"
    },
    {
      name: "Dress",
      description: "Standard dry cleaning for dresses",
      price: 12.99,
      duration: 45,
      taxable: true,
      imageUrl: "dress.png"
    },
    {
      name: "Pants/Slacks",
      description: "Dry cleaning for pants or slacks",
      price: 7.99,
      duration: 30,
      taxable: true,
      imageUrl: "pants.png"
    },
    {
      name: "Blazer/Sport Coat",
      description: "Dry cleaning for blazers or sport coats",
      price: 9.99,
      duration: 45,
      taxable: true,
      imageUrl: "blazer.png"
    }
  ],
  "Laundered Shirts": [
    {
      name: "Dress Shirt",
      description: "Laundering and pressing for dress shirts",
      price: 3.49,
      duration: 20,
      taxable: true,
      imageUrl: "dress-shirt.png"
    },
    {
      name: "Folded Shirt",
      description: "Laundering with fold service",
      price: 3.99,
      duration: 20,
      taxable: true,
      imageUrl: "folded-shirt.png"
    },
    {
      name: "Starched Shirt",
      description: "Laundering with starch application",
      price: 4.49,
      duration: 25,
      taxable: true,
      imageUrl: "starched-shirt.png"
    }
  ],
  "Household Items": [
    {
      name: "Comforter (Queen/King)",
      description: "Cleaning for queen or king size comforters",
      price: 29.99,
      duration: 120,
      taxable: true,
      imageUrl: "comforter.png"
    },
    {
      name: "Blanket",
      description: "Cleaning for standard blankets",
      price: 19.99,
      duration: 90,
      taxable: true,
      imageUrl: "blanket.png"
    },
    {
      name: "Curtains (per panel)",
      description: "Cleaning for curtain panels",
      price: 12.99,
      duration: 60,
      taxable: true,
      imageUrl: "curtains.png"
    },
    {
      name: "Area Rug (small)",
      description: "Cleaning for small area rugs",
      price: 24.99,
      duration: 120,
      taxable: true,
      imageUrl: "area-rug.png"
    }
  ],
  "Specialty Cleaning": [
    {
      name: "Wedding Dress",
      description: "Specialized cleaning for wedding dresses",
      price: 99.99,
      duration: 240,
      taxable: true,
      imageUrl: "wedding-dress.png"
    },
    {
      name: "Leather/Suede Item",
      description: "Specialized cleaning for leather or suede items",
      price: 49.99,
      duration: 180,
      taxable: true,
      imageUrl: "leather.png"
    },
    {
      name: "Silk Item",
      description: "Delicate cleaning for silk garments",
      price: 14.99,
      duration: 60,
      taxable: true,
      imageUrl: "silk.png"
    }
  ],
  "Alterations": [
    {
      name: "Hem Pants",
      description: "Standard hemming for pants",
      price: 12.99,
      duration: 45,
      taxable: true,
      imageUrl: "hem-pants.png"
    },
    {
      name: "Replace Zipper",
      description: "Zipper replacement service",
      price: 18.99,
      duration: 60,
      taxable: true,
      imageUrl: "zipper.png"
    },
    {
      name: "Take in Waist",
      description: "Alter waistline of pants or skirts",
      price: 15.99,
      duration: 60,
      taxable: true,
      imageUrl: "waist-alteration.png"
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
    
    // Create each item
    for (const item of items) {
      await createProduct({
        ...item,
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