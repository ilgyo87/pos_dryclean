// src/localdb/schemas.ts
// Updated schema definitions to ensure compatibility with type definitions

export const LocationSchema = {
  name: 'Location',
  embedded: true,
  properties: {
    lat: 'double',
    long: 'double',
  },
};

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
    location: 'Location?',
    email: 'string', // user email
    website: 'string?',
    hours: 'string[]',
    logoUrl: 'string?',
    logoSource: 'string?',
    userId: 'string?'
  },
};

export const CustomerSchema = {
  name: 'Customer',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    firstName: 'string', // required
    lastName: 'string', // required
    address: 'string?',
    city: 'string?',
    state: 'string?',
    zipCode: 'string?',
    phone: 'string', // required
    location: 'Location?',
    email: 'string?',
    businessId: 'string?',
    cognitoId: 'string?',
    notes: 'string[]',
    createdAt: 'date',
    updatedAt: 'date',
    dob: 'date?', // Date of birth
    credit: 'double?',
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
    color: 'string?',
    businessId: 'string',
  },
};

// Updated ProductSchema to include type and serviceId
export const ProductSchema = {
  name: 'Product',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    name: 'string',
    description: 'string?',
    price: 'double',
    discount: 'double?',
    additionalPrice: 'double?',
    categoryId: 'string', // Required - every product must belong to a category
    businessId: 'string', // Required - every product must belong to a business
    customerId: 'string?',
    employeeId: 'string?',
    orderId: 'string?',
    orderItemId: 'string?',
    starch: 'string?', // 'none', 'light', 'medium', 'heavy'
    pressOnly: 'bool?',
    imageName: 'string?',
    imageUrl: 'string?',
    notes: 'string[]',
    createdAt: 'date',
    updatedAt: 'date',
  },
};

// Add OrderItemSchema
export const OrderItemSchema = {
  name: 'OrderItem',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    orderId: 'string',
    productId: 'string',
    businessId: 'string',
    customerId: 'string',
    employeeId: 'string',
    paymentMethod: 'string',
    additionalPrice: 'double?',
    discount: 'double?',
    total: 'double',
    notes: 'string[]',
    starch: 'string?', // 'none', 'light', 'medium', 'heavy'
    pressOnly: 'bool?',
    status: 'string',
    createdAt: 'date',
    processedAt: 'date?',
    cleanedAt: 'date?',
    completedAt: 'date?',
    cancelledAt: 'date?',
    deliveredAt: 'date?',
    updatedAt: 'date',
  },
};

// Add OrderSchema
export const OrderSchema = {
  name: 'Order',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    customerId: 'string',
    businessId: 'string',
    items: 'OrderItem[]',
    discount: 'double?',
    additionalPrice: 'double?',
    paymentMethod: 'string',
    total: 'double',
    status: 'string', // 'pending', 'processing', 'ready', 'completed', 'cancelled'
    createdAt: 'date',
    pickupDate: 'date?',
    employeeId: 'string',
    notes: 'string[]',
  },
};

// Add EmployeeSchema back to support existing Realm data
export const EmployeeSchema = {
  name: 'Employee',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    firstName: 'string',
    lastName: 'string',
    address: 'string?',
    city: 'string?',
    state: 'string?',
    zipCode: 'string?',
    phone: 'string',
    location: 'Location?',
    email: 'string?',
    businessId: 'string?',
    cognitoId: 'string?',
    pin: 'string?',
    role: 'string',
    createdAt: 'date',
    updatedAt: 'date',
    dob: 'date?', // Date of birth
  },
};

// Export all schemas
export const AllSchemas = [
  LocationSchema,
  BusinessSchema,
  CustomerSchema,
  CategorySchema,
  ProductSchema,
  OrderItemSchema,
  OrderSchema,
  EmployeeSchema,
];
