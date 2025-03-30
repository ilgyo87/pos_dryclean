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
      counters: a.hasMany("Counter", "businessID"),
      customerCredits: a.hasMany("CustomerCredit", "businessID"),
      website: a.string(),
      qrCode: a.string()
    })
    .authorization((allow) => [
      allow.owner(),
      // Added access for authenticated users to support customer app
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
      qrCode: a.string()
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Customer Model - Modified to include credits
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
      credits: a.float().default(0), // Default to 0 credits
      globalId: a.string(), // Used as the universal ID for both POS and customer app
      notificationPreferences: a.string(), // JSON string of preferences
      lastLogin: a.datetime(),
      businessID: a.id().required(),
      business: a.belongsTo("Business", "businessID"),
      transactions: a.hasMany("Transaction", "customerID"),
      garments: a.hasMany("Garment", "customerID"),
      loyaltyProgram: a.hasOne("Loyalty", "customerID"),
      notifications: a.hasMany("CustomerNotification", "customerID"),
      appSessions: a.hasMany("CustomerAppSession", "customerID"),
      creditTransactions: a.hasMany("CustomerCredit", "customerID"),
      // Add these new fields:
    qrCode: a.string(),
    preferredContactMethod: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
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
      qrCode: a.string()
    })
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to see their own garments
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Service Model
  Service: a
    .model({
      id: a.id().required(),
      businessID: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      estimatedTime: a.integer(), //days
      urlPicture: a.string(),
      business: a.belongsTo("Business", "businessID"),
      products: a.hasMany("Product", "serviceID"),
      transactionItems: a.hasMany("TransactionItem", "serviceID")
    })
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to see available services
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Product Model
  Product: a
    .model({
      id: a.id().required(),
      businessID: a.id().required(),
      serviceID: a.id().required(), // Added serviceID to connect with services
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      urlPicture: a.string(),
      business: a.belongsTo("Business", "businessID"),
      service: a.belongsTo("Service", "serviceID"), // Added belongsTo relationship
      transactionItems: a.hasMany("TransactionItem", "productID")
    })
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to see available products
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Transaction Model - Modified to support credit payments and Square integration
  Transaction: a
    .model({
      id: a.id().required(),
      orderId: a.string().required(),
      businessID: a.id().required(),
      customerID: a.id().required(),
      employeeID: a.id(),
      status: a.string().required(),
      total: a.float().required(),
      paymentMethod: a.string().required(),
      pickupDate: a.string().required(),
      customerPreferences: a.string(),
      // Square payment fields
      transactionId: a.string(),
      receiptUrl: a.string(),
      paymentStatus: a.string(),
      transactionDate: a.string(),
      // New field for credit usage
      creditApplied: a.float().default(0),
      // New fields for customer app
      customerNotified: a.boolean(),
      lastStatusUpdate: a.datetime(),
      estimatedCompletionTime: a.datetime(),
      creditTransactions: a.hasMany("CustomerCredit", "transactionID"),
      // Original fields
      business: a.belongsTo("Business", "businessID"),
      customer: a.belongsTo("Customer", "customerID"),
      employee: a.belongsTo("Employee", "employeeID"),
      items: a.hasMany("TransactionItem", "transactionID"),
      payments: a.hasMany("Payment", "transactionID"),
      // Add bidirectional relation for notifications
      notifications: a.hasMany("CustomerNotification", "transactionID"),
      qrCode: a.string()
    })
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to view their transactions
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Transaction Item Model
  TransactionItem: a
    .model({
      id: a.id().required(),
      transactionID: a.id().required(),
      serviceID: a.id(),
      productID: a.id(),
      name: a.string().required(),
      itemType: a.string().required(), // "SERVICE" or "PRODUCT"
      quantity: a.integer().required(),
      price: a.float().required(),
      notes: a.string(),
      transaction: a.belongsTo("Transaction", "transactionID"),
      service: a.belongsTo("Service", "serviceID"),
      product: a.belongsTo("Product", "productID")
    })
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to view their transaction items
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

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
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to view their payments
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

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
    .authorization((allow) => [
      allow.owner(),
      // Allow customers to view their loyalty program
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),

  // Counter Model
  Counter: a
    .model({
      id: a.id().required(), // Use a predictable ID like "orderCounter" for your business
      businessID: a.id().required(),
      currentValue: a.integer().required(),
      business: a.belongsTo("Business", "businessID")
    })
    .authorization((allow) => allow.owner()),

  // New model for customer app notifications
  CustomerNotification: a
    .model({
      id: a.id().required(),
      customerID: a.id().required(),
      transactionID: a.id(),
      type: a.string().required(), // "ORDER_STATUS", "PICKUP_REMINDER", etc.
      message: a.string().required(),
      isRead: a.boolean().required(),
      createdAt: a.datetime().required(),
      customer: a.belongsTo("Customer", "customerID"),
      transaction: a.belongsTo("Transaction", "transactionID")
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list', 'update'])
    ]),

  // New model for customer app sessions
  CustomerAppSession: a
    .model({
      id: a.id().required(),
      customerID: a.id().required(),
      deviceToken: a.string(),
      deviceType: a.string(),
      lastActive: a.datetime().required(),
      customer: a.belongsTo("Customer", "customerID")
    })
    .authorization((allow) => allow.authenticated()),

  // New model for customer credits
  CustomerCredit: a
    .model({
      id: a.id().required(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      amount: a.float().required(), // Positive for additions, negative for usage
      balance: a.float().required(), // Running balance after this transaction
      description: a.string().required(), // E.g., "Pre-payment", "Used for order #123"
      transactionID: a.id(), // Optional, linked to a transaction if this credit was used for payment
      createdAt: a.datetime().required(),
      customer: a.belongsTo("Customer", "customerID"),
      business: a.belongsTo("Business", "businessID"),
      transaction: a.belongsTo("Transaction", "transactionID")
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['get', 'list', 'create', 'update', 'delete'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
});