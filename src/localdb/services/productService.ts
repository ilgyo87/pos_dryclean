import { getRealm } from '../getRealm';
import { Product } from '../../types';

export async function addProduct(product: Product) {
  const realm = await getRealm();
  let createdProduct;
  realm.write(() => {
    createdProduct = realm.create('Product', product);
  });
  return mapProduct(createdProduct);
}

function mapProduct(item: any) {
  return { ...item };
}

export async function getAllProducts() {
  const realm = await getRealm();
  const products = realm.objects('Product');
  return products.map(mapProduct);
}

export async function getProductById(id: string) {
  const realm = await getRealm();
  const product = realm.objectForPrimaryKey('Product', id);
  return product ? mapProduct(product) : null;
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
  const products = realm.objects('Product').filtered('categoryId == $0', categoryId);
  return products.map(mapProduct);
}

export async function getProductsByBusinessAndCategoryId(businessId: string, categoryId: string) {
  const realm = await getRealm();
  const products = realm.objects('Product').filtered('businessId == $0 && categoryId == $1', businessId, categoryId);
  return products.map(mapProduct);
}

export async function getProductsByBusinessId(businessId: string) {
  const realm = await getRealm();
  const products = realm.objects('Product').filtered('businessId == $0', businessId);
  return products.map(mapProduct);
}