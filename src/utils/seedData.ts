import { v4 as uuidv4 } from 'uuid';
import { generateClient } from 'aws-amplify/data';

// Define simple interfaces that match your schema
interface SeedItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string; // Changed from urlPicture to imageUrl to match the schema
  sku?: string;
  businessID: string;
  categoryID: string;
  taxable?: boolean;
}

interface SeedCategory {
  id: string;
  name: string;
  description?: string;
  businessID: string;
}

// Function to seed business data
export const seedBusinessData = async (businessId: string): Promise<void> => {
  try {
    // Use any to bypass complex type inference
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

    // Define categories with items, including imageUrl (previously urlPicture)
    const categoriesToCreate = [
      {
        name: "Dry Cleaning",
        description: "Standard dry cleaning services.",
        items: [
          { name: "Pants", price: 9.99, description: "Dry cleaning for pants", imageUrl: "https://images.pexels.com/photos/3639508/pexels-photo-3639508.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Dress Shirt", price: 7.99, description: "Dry cleaning for dress shirts", imageUrl: "https://images.pexels.com/photos/297933/pexels-photo-297933.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Suit", price: 19.99, description: "Professional dry cleaning for suits", imageUrl: "https://images.pexels.com/photos/128388/pexels-photo-128388.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Jacket", price: 14.99, description: "Dry cleaning for jackets", imageUrl: "https://images.pexels.com/photos/6069558/pexels-photo-6069558.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Coat", price: 24.99, description: "Dry cleaning for coats", imageUrl: "https://images.pexels.com/photos/7681796/pexels-photo-7681796.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Blouse", price: 7.99, description: "Dry cleaning for blouses", imageUrl: "https://images.pexels.com/photos/6858601/pexels-photo-6858601.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Skirt", price: 8.99, description: "Dry cleaning for skirts", imageUrl: "https://images.pexels.com/photos/1937336/pexels-photo-1937336.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Dress", price: 14.99, description: "Dry cleaning for dresses", imageUrl: "https://images.pexels.com/photos/4996752/pexels-photo-4996752.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Sweater", price: 8.99, description: "Dry cleaning for sweaters", imageUrl: "https://images.pexels.com/photos/6046229/pexels-photo-6046229.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true }
        ]
      },
      {
        name: "Laundry",
        description: "Wash and fold services.",
        items: [
          { name: "Shirt", description: "Washing and pressing for shirts", price: 3.99, imageUrl: "https://images.pexels.com/photos/6311387/pexels-photo-6311387.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Pants", description: "Washing and pressing for pants", price: 5.99, imageUrl: "https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "T-Shirt", description: "Washing and pressing for t-shirts", price: 2.99, imageUrl: "https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Standard Load (Wash & Fold)", price: 14.99, description: "Per load, up to 10 lbs", imageUrl: "https://images.pexels.com/photos/4439427/pexels-photo-4439427.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Large Load (Wash & Fold)", price: 19.99, description: "Per load, over 10 lbs", imageUrl: "https://images.pexels.com/photos/4439427/pexels-photo-4439427.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
        ]
      },
      {
        name: "Alterations",
        description: "Clothing alteration and repair services.",
        items: [
          { name: "Pants Alteration", description: "Alterations for pants (hem, waist, etc.)", price: 14.99, imageUrl: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Jacket Alteration", description: "Alterations for jackets (sleeves, fit, etc.)", price: 24.99, imageUrl: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Dress Alteration", description: "Alterations for dresses (hem, fit, etc.)", price: 19.99, imageUrl: "https://images.pexels.com/photos/6764032/pexels-photo-6764032.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Shirt Alteration", description: "Alterations for shirts (sleeve length, fit, etc.)", price: 14.99, imageUrl: "https://images.pexels.com/photos/6153352/pexels-photo-6153352.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Hem Pants", price: 12.00, description: "Adjust pant length", imageUrl: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Take In Waist", price: 15.00, description: "Adjust waistband size", imageUrl: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Replace Zipper (Pants/Skirt)", price: 18.00, description: "Replace broken zipper", imageUrl: "https://images.pexels.com/photos/4210857/pexels-photo-4210857.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Replace Zipper (Jacket)", price: 25.00, description: "Replace broken jacket zipper", imageUrl: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Shorten Sleeves (Shirt)", price: 10.00, description: "Adjust sleeve length on shirts", imageUrl: "https://images.pexels.com/photos/6153352/pexels-photo-6153352.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Shorten Sleeves (Jacket)", price: 20.00, description: "Adjust sleeve length on jackets", imageUrl: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
        ]
      },
      {
        name: "Household Items",
        description: "Cleaning services for household items.",
        items: [
          { name: "Comforter", description: "Cleaning for comforters", price: 29.99, imageUrl: "https://images.pexels.com/photos/6316051/pexels-photo-6316051.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Blanket", description: "Cleaning for blankets", price: 19.99, imageUrl: "https://images.pexels.com/photos/6957550/pexels-photo-6957550.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Rug", description: "Cleaning for rugs", price: 29.99, imageUrl: "https://images.pexels.com/photos/4947748/pexels-photo-4947748.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Pillow", description: "Cleaning for pillows", price: 12.99, imageUrl: "https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
        ]
      },
      {
        name: "Shoe Repair",
        description: "Repair services for various types of shoes.",
        items: [
          { name: "Heel Replacement", price: 20.00, description: "Replace worn heels", imageUrl: "https://images.pexels.com/photos/1478442/pexels-photo-1478442.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Sole Repair", price: 40.00, description: "Repair or replace soles", imageUrl: "https://images.pexels.com/photos/267320/pexels-photo-267320.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Shoe Shine", price: 8.00, description: "Professional shoe shining", imageUrl: "https://images.pexels.com/photos/1449844/pexels-photo-1449844.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
          { name: "Stretching", price: 15.00, description: "Stretch shoes for better fit", imageUrl: "https://images.pexels.com/photos/718981/pexels-photo-718981.jpeg?auto=compress&cs=tinysrgb&w=500", taxable: true },
        ]
      }
    ];

    let createdCategories = 0;
    let createdItems = 0;

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

        const categoryResult = await client.models.Category.create(categoryInput);

        if (categoryResult.errors) {
          console.error(`Error creating category ${categoryInfo.name}:`, categoryResult.errors);
          continue;
        }

        console.log(`✅ Created category: ${categoryInfo.name}`);
        createdCategories++;

        // Create items for this category
        for (const itemInfo of categoryInfo.items) {
          try {
            const itemId = uuidv4();
            const itemInput: SeedItem = {
              id: itemId,
              name: itemInfo.name,
              description: itemInfo.description,
              price: itemInfo.price,
              imageUrl: itemInfo.imageUrl, // Changed from urlPicture to imageUrl
              sku: `${categoryInfo.name.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
              taxable: itemInfo.taxable || true,
              businessID: businessId,
              categoryID: categoryId,
            };

            console.log(`Attempting to create item: ${JSON.stringify(itemInput)}`);
            const itemResult = await client.models.Item.create(itemInput);

            if (itemResult.errors) {
              console.error(`Error creating item ${itemInfo.name}:`, itemResult.errors);
              continue;
            }

            console.log(`  - Created item: ${itemInfo.name}`);
            createdItems++;

            // Verify the item was created with the correct relationship
            const verifyItem = await client.models.Item.get({ id: itemId });
            if (!verifyItem.data) {
              console.error(`  - Warning: Item ${itemInfo.name} was not found after creation`);
            } else if (verifyItem.data && 'categoryID' in verifyItem.data && verifyItem.data.categoryID !== categoryId) {
              console.error(`  - Warning: Item ${itemInfo.name} has incorrect categoryID: ${verifyItem.data.categoryID} vs expected ${categoryId}`);
            }

          } catch (itemError) {
            console.error(`Error creating item ${itemInfo.name}:`, itemError);
          }
        }
      } catch (categoryError) {
        console.error(`Error creating category ${categoryInfo.name}:`, categoryError);
      }
    }

    console.log(`✅ Completed seeding data for business ${businessId}`);
    console.log(`  - Created ${createdCategories} categories`);
    console.log(`  - Created ${createdItems} items`);

    // Verify all items were created with proper relationships
    try {
      const allItems = await client.models.Item.list({ filter: { businessID: { eq: businessId } } });
      console.log(`Verification found ${allItems.data?.length || 0} items for business ${businessId}`);

      if (allItems.data && allItems.data.length !== createdItems) {
        console.warn(`Warning: Expected ${createdItems} items but found ${allItems.data.length}`);
      }
    } catch (verifyError) {
      console.error('Error verifying items:', verifyError);
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};