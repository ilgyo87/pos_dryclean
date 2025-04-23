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
    email: 'string', // required
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
    updatedAt: 'date?',
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
    discount: 'double?',
    additionalPrice: 'double?',
    description: 'string?',
    categoryId: 'string?',
    businessId: 'string?',
    customerId: 'string?',
    employeeId: 'string?',
    orderId: 'string?',
    orderItemId: 'string?',
    starch: 'string?',
    pressOnly: 'bool?',
    imageName: 'string?',
    imageUrl: 'string?',
    notes: 'string[]',
    status: 'string',
    createdAt: 'date?',
    updatedAt: 'date?',
  },
};

export const OrderSchema = {
  name: 'Order',
  primaryKey: '_id',
  properties: {
    _id: 'string',
    businessId: 'string',
    customerId: 'string',
    employeeId: 'string',
    items: 'Product[]',
    paymentMethod: 'string',
    additionalPrice: 'double?',
    discount: 'double?',
    total: 'double',
    notes: 'string[]',
    pickupDate: 'date?',
    status: 'string',
    createdAt: 'date',
    updatedAt: 'date?',
  },
};

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
    updatedAt: 'date?',
  },
};