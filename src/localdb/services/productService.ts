import { getRealm } from '../getRealm';
import { Product } from '../../types';

export async function addProduct(product: Product) {
  const realm = await getRealm();
  let createdProduct;
  realm.write(() => {
    createdProduct = realm.create('Product', product);
  });
  return createdProduct;
}

export async function getAllProducts() {
  const realm = await getRealm();
  return realm.objects('Product');
}

export async function getProductById(id: string) {
  const realm = await getRealm();
  return realm.objectForPrimaryKey('Product', id);
}

export async function updateProduct(id: string, updates: Partial<Product>) {
  const realm = await getRealm();
  let updatedProduct;
  realm.write(() => {
    const product = realm.objectForPrimaryKey('Product', id);
    if (product) {
      Object.keys(updates).forEach(key => {
        // @ts-ignore
        product[key] = updates[key];
      });
      updatedProduct = product;
    }
  });
  return updatedProduct;
}

export async function deleteProduct(id: string) {
  const realm = await getRealm();
  let deleted = false;
  realm.write(() => {
    const product = realm.objectForPrimaryKey('Product', id);
    if (product) {
      realm.delete(product);
      deleted = true;
    }
  });
  return deleted;
}

export async function getProductsByCategoryId(categoryId: string) {
  const realm = await getRealm();
  return realm.objects<Product>('Product').filtered('categoryId == $0', categoryId);
}

export async function getProductsByBusinessId(businessId: string) {
  const realm = await getRealm();
  return realm.objects<Product>('Product').filtered('businessId == $0', businessId);
}