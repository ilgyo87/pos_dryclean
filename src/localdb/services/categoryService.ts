import { getRealm } from '../getRealm';
import { Category } from './../../types';

export async function addCategory(category: Category) {
  const realm = await getRealm();
  let createdCategory;
  
  realm.write(() => {
    // Make sure the category has a products array initialized
    const categoryToCreate = {
      ...category,
      products: [] // Initialize empty products array
    };
    console.log(`[categoryService] Creating category '${category.name}' with businessId: ${category.businessId}`);
    createdCategory = realm.create('Category', categoryToCreate);
  });
  
  console.log(`[categoryService] Successfully created category: ${category.name}`);
  return createdCategory;
}

function mapCategory(item: any) {
  return { ...item };
}

export async function getAllCategories() {
  const realm = await getRealm();
  const categories = realm.objects('Category');
  return categories.map(mapCategory);
}

export async function getCategoryById(id: string) {
  const realm = await getRealm();
  return realm.objectForPrimaryKey('Category', id);
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const realm = await getRealm();
  let updatedCategory;
  realm.write(() => {
    const category = realm.objectForPrimaryKey('Category', id);
    if (category) {
      Object.keys(updates).forEach(key => {
        // @ts-ignore
        category[key] = updates[key];
      });
      updatedCategory = category;
    }
  });
  return updatedCategory;
}

export async function deleteCategory(id: string) {
  const realm = await getRealm();
  let deleted = false;
  realm.write(() => {
    const category = realm.objectForPrimaryKey('Category', id);
    if (category) {
      realm.delete(category);
      deleted = true;
    }
  });
  return deleted;
}

// Get categories by business ID
export async function getCategoriesByBusinessId(businessId: string) {
  if (!businessId) {
    console.error('[categoryService] getCategoriesByBusinessId called with empty businessId');
    return [];
  }
  
  console.log(`[categoryService] Getting categories for business: '${businessId}'`);
  const realm = await getRealm();
  
  try {
    const categories = realm.objects('Category').filtered('businessId == $0', businessId);
    console.log(`[categoryService] Found ${categories.length} categories for business '${businessId}'`);
    
    // Debug logging for found categories
    if (categories.length > 0) {
      categories.forEach((cat, index) => {
        console.log(`[categoryService] Category ${index}: '${cat.name}', ID: ${cat._id}, products: ${Array.isArray(cat.products) ? cat.products.length : 0}`);
      });
    } else {
      console.log(`[categoryService] No categories found for business '${businessId}'`);
    }
    
    return categories.map(mapCategory);
  } catch (error) {
    console.error(`[categoryService] Error getting categories for business '${businessId}':`, error);
    return [];
  }
}