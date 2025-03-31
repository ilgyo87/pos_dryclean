import { v4 as uuidv4 } from 'uuid';
import { generateClient } from 'aws-amplify/data';

// Define simple interfaces that match your schema but don't depend on its complex type structure
interface SeedItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  urlPicture?: string; // Added urlPicture
  businessID: string;
  categoryID: string;
}

interface SeedCategory {
  id: string;
  name: string;
  description?: string;
  businessID: string;
  // Categories don't seem to have urlPicture in your schema, only items
}

// Function to seed business data
export const seedBusinessData = async (businessId: string): Promise<void> => {
  try {
    // Instead of importing the Schema type, we'll use any to bypass complex type inference
    const client = generateClient<any>();

    // Check if this business already has categories to avoid duplicate seeding
    const existingCategoriesResult = await client.models.Category.list({
      filter: { businessID: { eq: businessId } }
    });

    const existingCategories = existingCategoriesResult?.data || [];
    if (existingCategories.length > 0) {
      console.log('Business already has categories, skipping seed');
      return;
    }

    console.log('Starting to seed data for business', businessId);

    // Define categories with items, including urlPicture
    const categoriesToCreate = [
        {
            name: "Dry Cleaning",
            description: "Standard dry cleaning services.",
            // Category URL Picture not in schema, use Item URL Picture below
            items: [
                { name: "Pants", price: 9.99, description: "Dry cleaning for pants", urlPicture: "https://images.pexels.com/photos/3639508/pexels-photo-3639508.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Dress Shirt", price: 7.99, description: "Dry cleaning for dress shirts", urlPicture: "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Suit", price: 19.99, description: "Professional dry cleaning for suits", urlPicture: "https://images.pexels.com/photos/128388/pexels-photo-128388.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Jacket", price: 14.99, description: "Dry cleaning for jackets", urlPicture: "https://images.pexels.com/photos/6069558/pexels-photo-6069558.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Coat", price: 24.99, description: "Dry cleaning for coats", urlPicture: "https://images.pexels.com/photos/7681796/pexels-photo-7681796.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Blouse", price: 7.99, description: "Dry cleaning for blouses", urlPicture: "https://images.pexels.com/photos/6858601/pexels-photo-6858601.jpeg?auto=compress&cs=tinysrgb&w=500" },
                // Merged Skirt from Dry Cleaning and Dress from Alterations based on user data
                { name: "Skirt", price: 8.99, description: "Dry cleaning for skirts", urlPicture: "https://images.pexels.com/photos/1937336/pexels-photo-1937336.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Dress", price: 14.99, description: "Dry cleaning for dresses", urlPicture: "https://images.pexels.com/photos/4996752/pexels-photo-4996752.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Sweater", price: 8.99, description: "Dry cleaning for sweaters", urlPicture: "https://images.pexels.com/photos/6046229/pexels-photo-6046229.jpeg?auto=compress&cs=tinysrgb&w=500" }
            ]
        },
        {
            name: "Laundry",
            description: "Wash and fold services.",
             // Category URL Picture not in schema, use Item URL Picture below
            items: [
                // Items from user's "Laundry" Service
                { name: "Shirt", description: "Washing and pressing for shirts", price: 3.99, urlPicture: "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Pants", description: "Washing and pressing for pants", price: 5.99, urlPicture: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "T-Shirt", description: "Washing and pressing for t-shirts", price: 2.99, urlPicture: "https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=500" },
                // Adding items from original "Laundry" category for completeness if needed
                { name: "Standard Load (Wash & Fold)", price: 14.99, description: "Per load, up to 10 lbs", urlPicture: "https://images.pexels.com/photos/4439427/pexels-photo-4439427.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Placeholder image
                { name: "Large Load (Wash & Fold)", price: 19.99, description: "Per load, over 10 lbs", urlPicture: "https://images.pexels.com/photos/4439427/pexels-photo-4439427.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Placeholder image
            ]
        },
        {
            name: "Alterations",
            description: "Clothing alteration and repair services.",
            // Category URL Picture not in schema, use Item URL Picture below
            items: [
                // Items from user's "Alterations" Service
                { name: "Pants Alteration", description: "Alterations for pants (hem, waist, etc.)", price: 14.99, urlPicture: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Jacket Alteration", description: "Alterations for jackets (sleeves, fit, etc.)", price: 24.99, urlPicture: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Dress Alteration", description: "Alterations for dresses (hem, fit, etc.)", price: 19.99, urlPicture: "https://images.pexels.com/photos/6764032/pexels-photo-6764032.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Shirt Alteration", description: "Alterations for shirts (sleeve length, fit, etc.)", price: 14.99, urlPicture: "https://images.pexels.com/photos/6153352/pexels-photo-6153352.jpeg?auto=compress&cs=tinysrgb&w=500" },
                // Adding items from original "Alterations" category for completeness if needed
                { name: "Hem Pants", price: 12.00, description: "Adjust pant length", urlPicture: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Reuse image
                { name: "Take In Waist", price: 15.00, description: "Adjust waistband size", urlPicture: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Reuse image
                { name: "Replace Zipper (Pants/Skirt)", price: 18.00, description: "Replace broken zipper", urlPicture: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Reuse image
                { name: "Replace Zipper (Jacket)", price: 25.00, description: "Replace broken jacket zipper", urlPicture: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Reuse image
                { name: "Shorten Sleeves (Shirt)", price: 10.00, description: "Adjust sleeve length on shirts", urlPicture: "https://images.pexels.com/photos/6153352/pexels-photo-6153352.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Reuse image
                { name: "Shorten Sleeves (Jacket)", price: 20.00, description: "Adjust sleeve length on jackets", urlPicture: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500" }, // Reuse image
            ]
        },
        // Adding "Household Items" category based on user data
        {
            name: "Household Items",
            description: "Cleaning services for household items.",
            // Category URL Picture not in schema, use Item URL Picture below
            items: [
                { name: "Comforter", description: "Cleaning for comforters", price: 29.99, urlPicture: "https://images.pexels.com/photos/6316051/pexels-photo-6316051.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Blanket", description: "Cleaning for blankets", price: 19.99, urlPicture: "https://images.pexels.com/photos/6957550/pexels-photo-6957550.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Rug", description: "Cleaning for rugs", price: 29.99, urlPicture: "https://images.pexels.com/photos/4947748/pexels-photo-4947748.jpeg?auto=compress&cs=tinysrgb&w=500" },
                { name: "Pillow", description: "Cleaning for pillows", price: 12.99, urlPicture: "https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=500" },
            ]
        },
        // Shoe repair was in the original data but not the user's Service data, adding it back for completeness
        {
            name: "Shoe Repair",
            description: "Repair services for various types of shoes.",
            // Category URL Picture not in schema, use Item URL Picture below
            items: [
                { name: "Heel Replacement", price: 20.00, description: "Replace worn heels", urlPicture: "https://images.pexels.com/photos/example/shoe_heel.jpeg" }, // Needs image URL
                { name: "Sole Repair", price: 40.00, description: "Repair or replace soles", urlPicture: "https://images.pexels.com/photos/example/shoe_sole.jpeg" }, // Needs image URL
                { name: "Shoe Shine", price: 8.00, description: "Professional shoe shining", urlPicture: "https://images.pexels.com/photos/example/shoe_shine.jpeg" }, // Needs image URL
                { name: "Stretching", price: 15.00, description: "Stretch shoes for better fit", urlPicture: "https://images.pexels.com/photos/example/shoe_stretch.jpeg" }, // Needs image URL
            ]
        }
    ];


    // Create each category and its items
    for (const categoryInfo of categoriesToCreate) {
      try {
        // Create category
        const categoryId = uuidv4();
        const categoryInput: SeedCategory = {
          id: categoryId,
          name: categoryInfo.name,
          description: categoryInfo.description,
          businessID: businessId,
        };

        await client.models.Category.create(categoryInput);
        console.log(`✅ Created category: ${categoryInfo.name}`);

        // Create items for this category
        for (const itemInfo of categoryInfo.items) {
          try {
            const itemInput: SeedItem = { // Use the SeedItem interface
              id: uuidv4(),
              name: itemInfo.name,
              description: itemInfo.description,
              price: itemInfo.price,
              urlPicture: itemInfo.urlPicture, // Add urlPicture here
              businessID: businessId,
              categoryID: categoryId,
            };

            await client.models.Item.create(itemInput);
            console.log(`  - Created item: ${itemInfo.name}`);
          } catch (itemError) {
            console.error(`Error creating item ${itemInfo.name}:`, itemError);
          }
        }
      } catch (categoryError) {
        console.error(`Error creating category ${categoryInfo.name}:`, categoryError);
      }
    }

    console.log('✅ Completed seeding data for business', businessId);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};