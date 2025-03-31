import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // Business Model
  Business: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      phoneNumber: a.phone().required(),
      email: a.email(),
      website: a.url(),
      description: a.string(),
      hoursOfOperation: a.json(), // Store operating hours as JSON
      ownerName: a.string(), // Optional: Store owner's name for display
      logoUrl: a.url(),
      ownerCognitoId: a.string(), // Store the Cognito ID of the owner
      qrCode: a.string(), // Store the S3 key or identifier for the QR code
      // Relationships
      categories: a.hasMany('Category', 'businessId'), // Business has many Categories
      items: a.hasMany('Item', 'businessId'), // Business has many Items
      customers: a.hasMany('Customer', 'businessId'),
      orders: a.hasMany('Order', 'businessId'),
      employees: a.hasMany('Employee', 'businessId'),
      garments: a.hasMany('Garment', 'businessId'),
      transactions: a.hasMany('Transaction', 'businessId'),
      loyaltyPrograms: a.hasMany('Loyalty', 'businessId'),
      counters: a.hasMany('Counter', 'businessId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('ownerCognitoId'), // Owner can CRUD
      allow.authenticated().to(['read']), // Any logged-in user can read
    ]),

  // Employee Model
  Employee: a
    .model({
      id: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phoneNumber: a.phone().required(),
      role: a.string().required(),
      businessId: a.id().required(),
      qrCode: a.string(),
      // Relationships
      business: a.belongsTo('Business', 'businessId'),
      transactions: a.hasMany('Transaction', 'employeeId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),

  // Category Model (replaces Service)
  Category: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      businessId: a.id().required(), // Foreign key for Business
      // Relationships
      business: a.belongsTo('Business', 'businessId'),
      items: a.hasMany('Item', 'categoryId'), // Category has many Items
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'), // Owner of the related Business can CRUD
      allow.authenticated().to(['read']),
    ]),

  // Item Model (replaces Product)
  Item: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      urlPicture: a.url(),
      categoryId: a.id().required(), // Foreign key for Category
      businessId: a.id().required(), // Foreign key for Business
      // Relationships
      category: a.belongsTo('Category', 'categoryId'),
      business: a.belongsTo('Business', 'businessId'),
      orderItems: a.hasMany('OrderItem', 'itemId'), // Item can be in many OrderItems
      transactionItems: a.hasMany('TransactionItem', 'itemId'), // Item can be in many TransactionItems
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'), // Owner of the related Business can CRUD
      allow.authenticated().to(['read']),
    ]),

  // Customer Model
  Customer: a
    .model({
      id: a.id().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phoneNumber: a.phone().required(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      notes: a.string(),
      qrCode: a.string(),
      businessId: a.id().required(),
      // Relationships
      business: a.belongsTo('Business', 'businessId'),
      orders: a.hasMany('Order', 'customerId'),
      garments: a.hasMany('Garment', 'customerId'),
      transactions: a.hasMany('Transaction', 'customerId'),
      loyaltyProgram: a.hasOne('Loyalty', 'customerId'),
      notifications: a.hasMany('CustomerNotification', 'customerId'),
      creditTransactions: a.hasMany('CustomerCredit', 'customerId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'), // Owner of related Business can CRUD
      allow.authenticated().to(['read']), 
    ]),

  // Order Model (for order processing in business)
  Order: a
    .model({
      id: a.id().required(),
      orderNumber: a.string().required(), // Consider generating this automatically
      orderDate: a.datetime().required(),
      dueDate: a.datetime().required(),
      status: a.enum(['Pending', 'Processing', 'Ready', 'Completed', 'Cancelled']),
      totalAmount: a.float().required(),
      notes: a.string(),
      customerId: a.id().required(),
      businessId: a.id().required(),
      // Relationships
      customer: a.belongsTo('Customer', 'customerId'),
      business: a.belongsTo('Business', 'businessId'),
      items: a.hasMany('OrderItem', 'orderId'), // Order has many OrderItems
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'), // Owner of related Business can CRUD
      allow.authenticated().to(['read']),
    ]),

  // OrderItem Model
  OrderItem: a
    .model({
      id: a.id().required(),
      quantity: a.integer().required(),
      priceAtOrder: a.float().required(), // Price of the item when the order was placed
      notes: a.string(),
      orderId: a.id().required(),
      itemId: a.id().required(),
      // Relationships
      order: a.belongsTo('Order', 'orderId'),
      item: a.belongsTo('Item', 'itemId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('order.business.ownerCognitoId'), // Owner of the related Business (via Order) can CRUD
      allow.authenticated().to(['read']),
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
      qrCode: a.string(),
      customerId: a.id().required(),
      businessId: a.id().required(),
      // Relationships
      customer: a.belongsTo('Customer', 'customerId'),
      business: a.belongsTo('Business', 'businessId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),

  // Transaction Model (for checkout portion)
  Transaction: a
    .model({
      id: a.id().required(),
      transactionNumber: a.string().required(),
      transactionDate: a.datetime().required(),
      status: a.enum(['Pending', 'Completed', 'Failed', 'Refunded']),
      total: a.float().required(),
      paymentMethod: a.enum(['Cash', 'Credit', 'Debit', 'Bank', 'Other']),
      paymentStatus: a.enum(['Pending', 'Paid', 'Failed', 'Refunded']),
      notes: a.string(),
      receiptUrl: a.string(),
      externalTransactionId: a.string(), // For payment processor reference
      customerId: a.id().required(),
      businessId: a.id().required(),
      employeeId: a.id(),
      orderId: a.id(), // Link to the order this transaction is for (if applicable)
      qrCode: a.string(),
      // Relationships
      customer: a.belongsTo('Customer', 'customerId'),
      business: a.belongsTo('Business', 'businessId'),
      employee: a.belongsTo('Employee', 'employeeId'),
      order: a.belongsTo('Order', 'orderId'),
      items: a.hasMany('TransactionItem', 'transactionId'),
      creditTransactions: a.hasMany('CustomerCredit', 'transactionId'),
      notifications: a.hasMany('CustomerNotification', 'transactionId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),

  // Transaction Item Model
  TransactionItem: a
    .model({
      id: a.id().required(),
      quantity: a.integer().required(),
      price: a.float().required(),
      notes: a.string(),
      transactionId: a.id().required(),
      itemId: a.id().required(),
      // Relationships
      transaction: a.belongsTo('Transaction', 'transactionId'),
      item: a.belongsTo('Item', 'itemId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('transaction.business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),

  // Loyalty Program Model
  Loyalty: a
    .model({
      id: a.id().required(),
      points: a.integer().default(0),
      level: a.string(),
      lastActivityDate: a.datetime(),
      customerId: a.id().required(),
      businessId: a.id().required(),
      // Relationships
      customer: a.belongsTo('Customer', 'customerId'),
      business: a.belongsTo('Business', 'businessId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),

  // Counter Model (for generating sequential IDs)
  Counter: a
    .model({
      id: a.id().required(), // Use a predictable ID like "orderCounter" for your business
      name: a.string().required(), // e.g., "orderCounter", "transactionCounter"
      currentValue: a.integer().required().default(0),
      businessId: a.id().required(),
      // Relationships
      business: a.belongsTo('Business', 'businessId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'),
    ]),

  // Customer Notification Model
  CustomerNotification: a
    .model({
      id: a.id().required(),
      type: a.enum(['OrderStatus', 'PickupReminder', 'Promotion', 'Other']),
      message: a.string().required(),
      isRead: a.boolean().default(false),
      createdAt: a.datetime().required(),
      customerId: a.id().required(),
      transactionId: a.id(), // Optional, if notification is related to a transaction
      // Relationships
      customer: a.belongsTo('Customer', 'customerId'),
      transaction: a.belongsTo('Transaction', 'transactionId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('customer.business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),

  // Customer Credit Model
  CustomerCredit: a
    .model({
      id: a.id().required(),
      amount: a.float().required(), // Positive for additions, negative for usage
      balance: a.float().required(), // Running balance after this transaction
      description: a.string().required(), // E.g., "Pre-payment", "Used for order #123"
      createdAt: a.datetime().required(),
      customerId: a.id().required(),
      businessId: a.id().required(),
      transactionId: a.id(), // Optional, linked to a transaction if this credit was used for payment
      // Relationships
      customer: a.belongsTo('Customer', 'customerId'),
      business: a.belongsTo('Business', 'businessId'),
      transaction: a.belongsTo('Transaction', 'transactionId'),
    })
    .authorization((allow) => [
      allow.ownerDefinedIn('business.ownerCognitoId'),
      allow.authenticated().to(['read']),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
});