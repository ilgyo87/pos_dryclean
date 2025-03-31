// src/utils/seedData.ts
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

// Define the interface based on the Schema's Category and Item models
interface DefaultCategory {
  name: string;
  description?: string;
  items: {
    name: string;
    description?: string;
    price: number;
    // Add other Item fields as needed, e.g., estimatedTime, urlPicture
  }[];
}

export const seedBusinessData = async (businessId: string) => {
  const defaultCategories: DefaultCategory[] = [
    {
      name: "Dry Cleaning",
      description: "Standard dry cleaning services.",
      items: [
        { name: "Pants", price: 9.99, description: "Dry cleaning for pants" },
        { name: "Dress Shirt", price: 7.99, description: "Dry cleaning for dress shirts" },
        { name: "Suit", price: 19.99, description: "Professional dry cleaning for suits" },
        { name: "Jacket", price: 14.99, description: "Dry cleaning for jackets" },
        { name: "Coat", price: 24.99, description: "Dry cleaning for coats" },
        { name: "Blouse", price: 7.99, description: "Dry cleaning for blouses" },
        { name: "Dress", price: 15.99, description: "Dry cleaning for dresses" },
        { name: "Sweater", price: 8.99, description: "Dry cleaning for sweaters" },
      ]
    },
    {
      name: "Laundry",
      description: "Wash and fold services.",
      items: [
        { name: "Standard Load (Wash & Fold)", price: 14.99, description: "Per load, up to 10 lbs" },
        { name: "Large Load (Wash & Fold)", price: 19.99, description: "Per load, over 10 lbs" },
        { name: "Comforter (Wash & Fold)", price: 29.99, description: "Wash and fold for comforters" },
        { name: "Blanket (Wash & Fold)", price: 19.99, description: "Wash and fold for blankets" },
      ]
    },
    {
      name: "Alterations",
      description: "Clothing alteration and repair services.",
      items: [
        { name: "Hem Pants", price: 12.00, description: "Adjust pant length" },
        { name: "Take In Waist", price: 15.00, description: "Adjust waistband size" },
        { name: "Replace Zipper (Pants/Skirt)", price: 18.00, description: "Replace broken zipper" },
        { name: "Replace Zipper (Jacket)", price: 25.00, description: "Replace broken jacket zipper" },
        { name: "Shorten Sleeves (Shirt)", price: 10.00, description: "Adjust sleeve length on shirts" },
        { name: "Shorten Sleeves (Jacket)", price: 20.00, description: "Adjust sleeve length on jackets" },
      ]
    },
    {
      name: "Shoe Repair",
      description: "Repair services for various types of shoes.",
      items: [
        { name: "Heel Replacement", price: 20.00, description: "Replace worn heels" },
        { name: "Sole Repair", price: 40.00, description: "Repair or replace soles" },
        { name: "Shoe Shine", price: 8.00, description: "Professional shoe shining" },
        { name: "Stretching", price: 15.00, description: "Stretch shoes for better fit" },
      ]
    }
    // Add more default categories and items as needed
  ];

  console.log(`Starting data seeding for business ID: ${businessId}`);

  try {
    for (const categoryData of defaultCategories) {
      // Create the Category
      const categoryResult = await client.models.Category.create({
        name: categoryData.name,
        description: categoryData.description,
        businessId: businessId, // Link category to the business
      });

      if (categoryResult.errors) {
        console.error(`Error creating category ${categoryData.name}:`, categoryResult.errors);
        continue; // Skip to the next category if creation failed
      }

      const createdCategory = categoryResult.data;
      if (!createdCategory) {
        console.error(`Category data is null for ${categoryData.name} despite no errors.`);
        continue;
      }

      console.log(`Created category: ${createdCategory.name} (ID: ${createdCategory.id})`);

      // Create Items for the Category
      if (categoryData.items && categoryData.items.length > 0) {
        for (const itemData of categoryData.items) {
          const itemResult = await client.models.Item.create({
            name: itemData.name,
            description: itemData.description,
            price: itemData.price,
            businessId: businessId,
            categoryId: createdCategory.id, // Link item to the category
            // Add other Item fields here if necessary
          });

          if (itemResult.errors) {
            console.error(`Error creating item ${itemData.name} in category ${createdCategory.name}:`, itemResult.errors);
          } else if (itemResult.data) {
            console.log(`  - Created item: ${itemResult.data.name} (ID: ${itemResult.data.id})`);
          } else {
             console.error(`Item data is null for ${itemData.name} despite no errors.`);
          }
        }
      }
    }
    console.log(`Data seeding completed successfully for business ID: ${businessId}`);
  } catch (error) {
    console.error(`An unexpected error occurred during seeding for business ID ${businessId}:`, error);
  }
};