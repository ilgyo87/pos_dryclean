import { getRealm } from '../getRealm';
import { Category } from './../../types';

export async function addCategory(category: Category) {
  const realm = await getRealm();
  let createdCategory;
  realm.write(() => {
    createdCategory = realm.create('Category', category);
  });
  return createdCategory;
}

export async function getAllCategories() {
  const realm = await getRealm();
  return realm.objects('Category');
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
  const realm = await getRealm();
  return realm.objects<Category>('Category').filtered('businessId == $0', businessId);
}