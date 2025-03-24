import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // Business Model
  Business: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phoneNumber: a.string().required(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      owner: a.string().required(),
      services: a.hasMany("Service", "businessID"),
      products: a.hasMany("Product", "businessID"),
      transactions: a.hasMany("Transaction", "businessID"),
      employees: a.hasMany("Employee", "businessID"),
      customers: a.hasMany("Customer", "businessID"),
      garments: a.hasMany("Garment", "businessID"),
      loyaltyPrograms: a.hasMany("Loyalty", "businessID"),
      qrCodeImageUrl: a.string(),
      website: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Employee Model
  Employee: a
    .model({
      id: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phoneNumber: a.phone().required(),
      role: a.string().required(),
      businessID: a.id().required(),
      business: a.belongsTo("Business", "businessID"),
      transactions: a.hasMany("Transaction", "employeeID"),
      qrCodeImageUrl: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list'])
    ]),

  // Customer Model
  Customer: a
    .model({
      id: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phoneNumber: a.phone().required(),
      email: a.email(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      notes: a.string(),
      profileImageUrl: a.string(),
      qrCodeImageUrl: a.string(),
      globalId: a.string(),
      businessID: a.id().required(),
      business: a.belongsTo("Business", "businessID"),
      transactions: a.hasMany("Transaction", "customerID"),
      garments: a.hasMany("Garment", "customerID"),
      loyaltyProgram: a.hasOne("Loyalty", "customerID")
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list'])
    ]),

  // Garment Model
  Garment: a
    .model({
      id: a.id().required(),
      description: a.string().required(),
      type: a.string().required(),
      brand: a.string(),
      size: a.string(),
      color: a.string(),
      material: a.string(),
      businessID: a.id().required(),
      business: a.belongsTo("Business", "businessID"),
      customerID: a.id().required(),
      customer: a.belongsTo("Customer", "customerID"),
      qrCodeImageUrl: a.string(),
    })
    .authorization((allow) => allow.owner()),

  // Service Model
  Service: a
    .model({
      id: a.id().required(),
      businessID: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      estimatedTime: a.integer(),
      category: a.string(),
      business: a.belongsTo("Business", "businessID"),
      transactionItems: a.hasMany("TransactionItem", "serviceID")
    })
    .authorization((allow) => allow.owner()),

  // Product Model
  Product: a
    .model({
      id: a.id().required(),
      businessID: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      inventory: a.integer(),
      business: a.belongsTo("Business", "businessID"),
      transactionItems: a.hasMany("TransactionItem", "productID")
    })
    .authorization((allow) => allow.owner()),

  // Transaction Model
  Transaction: a
    .model({
      id: a.id().required(),
      orderId: a.string().required(),
      businessID: a.id().required(),
      customerID: a.id().required(),
      employeeID: a.id().required(),
      status: a.string().required(),
      total: a.float().required(),
      paymentMethod: a.string().required(),
      pickupDate: a.string().required(),
      customerNotes: a.string(),
      business: a.belongsTo("Business", "businessID"),
      customer: a.belongsTo("Customer", "customerID"),
      employee: a.belongsTo("Employee", "employeeID"),
      items: a.hasMany("TransactionItem", "transactionID"),
      payments: a.hasMany("Payment", "transactionID")
    })
    .authorization((allow) => allow.owner()),

  // Transaction Item Model
  TransactionItem: a
    .model({
      id: a.id().required(),
      transactionID: a.id().required(),
      serviceID: a.id(),
      productID: a.id(),
      quantity: a.integer().required(),
      price: a.float().required(),
      notes: a.string(),
      transaction: a.belongsTo("Transaction", "transactionID"),
      service: a.belongsTo("Service", "serviceID"),
      product: a.belongsTo("Product", "productID")
    })
    .authorization((allow) => allow.owner()),

  // Payment Model
  Payment: a
    .model({
      id: a.id().required(),
      transactionID: a.id().required(),
      amount: a.float().required(),
      paymentMethod: a.string().required(),
      paymentDate: a.datetime().required(),
      transaction: a.belongsTo("Transaction", "transactionID")
    })
    .authorization((allow) => allow.owner()),

  // Loyalty Program Model
  Loyalty: a
    .model({
      id: a.id().required(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      points: a.integer().required(),
      lastTransactionDate: a.datetime(),
      customer: a.belongsTo("Customer", "customerID"),
      business: a.belongsTo("Business", "businessID")
    })
    .authorization((allow) => allow.owner()),

  // Counter Model
  Counter: a
    .model({
      id: a.id().required(), // Use a predictable ID like "orderCounter" for your business
      businessID: a.id().required(),
      currentValue: a.integer().required(),
      business: a.belongsTo("Business", "businessID")
    })
    .authorization((allow) => allow.owner()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
});