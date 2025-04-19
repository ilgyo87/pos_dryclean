export const BusinessSchema = {
  name: 'Business',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    businessName: 'string',
    firstName: 'string?',
    lastName: 'string?',
    address: 'string?',
    city: 'string?',
    state: 'string?',
    zipCode: 'string?',
    phone: 'string',
    coordinates: 'string?',
    email: 'string?',
    website: 'string?',
    hours: 'string[]',
    logoUrl: 'string?',
    userId: 'string?',
    orders: 'Order[]',
  },
};

export const CustomerSchema = {
  name: 'Customer',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    firstName: 'string',
    lastName: 'string',
    address: 'string?',
    city: 'string?',
    phone: 'string?',
    email: 'string?',
    businessId: 'string?',
    cognitoId: 'string?',
    orders: 'Order[]',
    garments: 'Garment[]',
  },
};

export const CategorySchema = {
  name: 'Category',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    description: 'string?',
    products: 'Product[]',
  },
};

export const ProductSchema = {
  name: 'Product',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    price: 'double',
    description: 'string?',
    category: 'Category?',
  },
};

export const OrderSchema = {
  name: 'Order',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    customer: 'Customer?',
    items: 'Product[]',
    total: 'double',
    paymentMethod: 'string?',
    status: 'string?',
    createdAt: 'date',
  },
};

export const GarmentSchema = {
  name: 'Garment',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    description: 'string?',
    category: 'Category?',
  },
};