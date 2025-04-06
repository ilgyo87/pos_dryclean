// amplify/data/resource.ts

import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  // Business Model
  Business: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      firstName: a.string(),
      lastName: a.string(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      phoneNumber: a.phone().required(),
      email: a.email(),
      website: a.url(),
      description: a.string(),
      hours: a.string(), // Consider JSON string or break down further if complex querying needed
      logoUrl: a.url(),
      industry: a.string(),
      establishedDate: a.date(),
      taxId: a.string(),
      isActive: a.boolean().default(true),
      userId: a.string(), 
      qrCode: a.string(), // Store the S3 key for the QR code image

      // --- Relationships (Commented out to reduce type complexity) ---
      // categories: a.hasMany('Category', 'businessID'),
      // items: a.hasMany('Item', 'businessID'),
      // customers: a.hasMany('Customer', 'businessID'),
      // employees: a.hasMany('Employee', 'businessID'),
      // garments: a.hasMany('Garment', 'businessID'),
      // transactions: a.hasMany('Transaction', 'businessID'),
      // orders: a.hasMany('Order', 'businessID'),
      // notifications: a.hasMany('CustomerNotification', 'businessID'),
      // credits: a.hasMany('CustomerCredit', 'businessID')
    })
    .authorization((allow) => [
      allow.owner(), // Allow owner full access
      allow.authenticated().to(['read', 'update', 'delete', 'create']), // Allow any logged-in user to read
      // Add group-based or other rules if needed
    ]),

  // Category Model
  Category: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      businessID: a.string().required(), // Foreign key for Business
      // Define relationships
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      items: a.hasMany('Item', 'categoryID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // Item Model (Service or Product)
  Item: a
    .model({
      id: a.id().required(),
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      duration: a.integer(), // Optional: duration in minutes for services
      sku: a.string(), // Stock Keeping Unit
      taxable: a.boolean().default(true),
      imageUrl: a.url(),
      businessID: a.string().required(), // Foreign key for Business
      categoryID: a.string().required(), // Foreign key for Category
      // Define relationships
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      category: a.belongsTo('Category', 'categoryID'), // Keep belongsTo
      orderItems: a.hasMany('OrderItem', 'itemID'),
      transactionItems: a.hasMany('TransactionItem', 'itemID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // Customer Model
  Customer: a
    .model({
      id: a.id().required(),
      cognitoUserId: a.string(), // Link to Cognito User if customer can log in
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phone: a.phone(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      notes: a.string(),
      joinDate: a.date().required(),
      lastActiveDate: a.date(),
      preferences: a.string(), // Store as JSON string
      businessID: a.string().required(), // Foreign key for Business
      qrCode: a.string(),
      // Define relationships
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      orders: a.hasMany('Order', 'customerID'),
      garments: a.hasMany('Garment', 'customerID'),
      transactions: a.hasMany('Transaction', 'customerID'),
      notifications: a.hasMany('CustomerNotification', 'customerID'),
      credits: a.hasMany('CustomerCredit', 'customerID')
    })
    .authorization((allow) => [
      allow.owner(), // Business owner can manage customers
      allow.authenticated().to(['read', 'update', 'delete', 'create']), // Or adjust as needed
    ]),

  // Employee Model
  Employee: a
    .model({
      id: a.id().required(),
      cognitoUserId: a.string().required(), // Link to Cognito User
      firstName: a.string().required(),
      lastName: a.string().required(),
      role: a.string().required(), // e.g., 'manager', 'staff'
      hireDate: a.date().required(),
      permissions: a.string(), // Store as JSON string or list of strings
      businessID: a.string().required(), // Foreign key for Business
      // Define relationships
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      transactions: a.hasMany('Transaction', 'employeeID'),
      orders: a.hasMany('Order', 'employeeID')
    })
    .authorization((allow) => [
      allow.owner(), // Business owner can manage employee
    ]),

  // ... (Keep other models like Garment, Transaction, Order, etc., as they were, including their `belongsTo('Business', ...)` relationships)
  // Garment Model
  Garment: a
    .model({
      id: a.id().required(),
      description: a.string().required(),
      type: a.string().required(), // e.g., 'shirt', 'pants', 'dress'
      brand: a.string(),
      size: a.string(),
      color: a.string(),
      material: a.string(),
      notes: a.string(), // Special instructions or conditions
      imageUrl: a.url(),
      qrCode: a.string(), // Unique QR code per garment for tracking
      status: a.string().required().default('Checked In'), // e.g., 'Checked In', 'Cleaning', 'Ready', 'Claimed'
      checkInDate: a.datetime().required(),
      readyDate: a.datetime(),
      claimedDate: a.datetime(),
      customerID: a.string().required(), // Foreign key for Customer
      businessID: a.string().required(), // Foreign key for Business
      orderItemID: a.string(), // Link to the specific order item if part of an order
      // Define relationships
      customer: a.belongsTo('Customer', 'customerID'), // Keep belongsTo
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      orderItem: a.belongsTo('OrderItem', 'orderItemID')
    })
    .authorization((allow) => [
      allow.owner(), // Business owner
      allow.authenticated().to(['read', 'update', 'delete', 'create']), // Customer/Employee can read
    ]),

  // Transaction Model (for checkout portion)
  Transaction: a
    .model({
      id: a.id().required(),
      transactionNumber: a.string().required(), // Business-specific transaction number
      transactionDate: a.datetime().required(),
      status: a.string().required(), // e.g., 'Completed', 'Pending', 'Refunded'
      subtotal: a.float().required(),
      tax: a.float().required(),
      discount: a.float(),
      total: a.float().required(),
      paymentMethod: a.string().required(), // e.g., 'Cash', 'Card', 'Credit'
      paymentStatus: a.string().required(), // e.g., 'Paid', 'Unpaid', 'Partial'
      notes: a.string(),
      receiptUrl: a.url(), // Link to generated receipt (e.g., S3 URL)
      externalTransactionId: a.string(), // ID from payment processor
      customerID: a.string().required(), // Foreign key for Customer
      businessID: a.string().required(), // Foreign key for Business
      employeeID: a.string(), // Foreign key for Employee (optional)
      orderID: a.string(), // Foreign key for Order (optional, if transaction is directly for an order)
      qrCode: a.string(), // QR Code for receipt lookup?
      pickupDate: a.datetime(), // Optional pickup date
      customerPreferences: a.string(), // Optional customer preferences
      // Define relationships
      customer: a.belongsTo('Customer', 'customerID'), // Keep belongsTo
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      employee: a.belongsTo('Employee', 'employeeID'),
      order: a.belongsTo('Order', 'orderID'),
      transactionItems: a.hasMany('TransactionItem', 'transactionID'), // Link to items sold
      credits: a.hasMany('CustomerCredit', 'transactionID'), // Credits applied/used
      notifications: a.hasMany('CustomerNotification', 'transactionID') // Notifications related
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // TransactionItem Model (line item within a transaction)
  TransactionItem: a
    .model({
      id: a.id().required(),
      quantity: a.integer().required(),
      priceAtTransaction: a.float().required(),
      transactionID: a.string().required(), // Foreign key for Transaction
      itemID: a.string().required(), // Foreign key for Item (product/service sold)
      // Define relationships
      transaction: a.belongsTo('Transaction', 'transactionID'),
      item: a.belongsTo('Item', 'itemID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // Order Model (for tracking cleaning/service orders)
  Order: a
    .model({
      id: a.id().required(),
      orderNumber: a.string().required(), // Business-specific order number
      orderDate: a.datetime().required(),
      dueDate: a.datetime(),
      status: a.string().required(), // e.g., 'Received', 'Processing', 'Ready for Pickup', 'Completed', 'Cancelled'
      notes: a.string(),
      estimatedTotal: a.float(),
      actualTotal: a.float(), // Final total after completion
      priority: a.integer().default(0), // 0 = normal, higher = more urgent
      qrCode: a.string(), // QR code for quick lookup
      customerID: a.string().required(), // Foreign key for Customer
      businessID: a.string().required(), // Foreign key for Business
      employeeID: a.string(), // Foreign key for Employee who took order (optional)
      // Define relationships
      customer: a.belongsTo('Customer', 'customerID'), // Keep belongsTo
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      employee: a.belongsTo('Employee', 'employeeID'),
      orderItems: a.hasMany('OrderItem', 'orderID'), // Items included in the order
      transactions: a.hasMany('Transaction', 'orderID'), // Related payments/transactions
      notifications: a.hasMany('CustomerNotification', 'orderID'), // Notifications related
      credits: a.hasMany('CustomerCredit', 'orderID') // Credits applied/used
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // OrderItem Model (line item within an order)
  OrderItem: a
    .model({
      id: a.id().required(),
      quantity: a.integer().required(),
      priceAtOrder: a.float().required(), // Price of the service/item when ordered
      status: a.string(), // Status specific to this item (e.g., 'Cleaning', 'Ready')
      notes: a.string(),
      orderID: a.string().required(), // Foreign key for Order
      itemID: a.string().required(), // Foreign key for Item (service being performed)
      garmentID: a.string(), // Optional link to a specific garment being serviced
      // Define relationships
      order: a.belongsTo('Order', 'orderID'),
      item: a.belongsTo('Item', 'itemID'),
      garment: a.hasOne('Garment', 'orderItemID') // Assuming one garment per order item line
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // CustomerNotification Model
  CustomerNotification: a
    .model({
      id: a.id().required(),
      message: a.string().required(),
      type: a.string().required(), // e.g., 'SMS', 'Email', 'Push'
      status: a.string().required(), // e.g., 'Sent', 'Delivered', 'Failed'
      sentAt: a.datetime().required(),
      customerID: a.string().required(),
      businessID: a.string().required(),
      orderID: a.string(), // Related order (optional)
      transactionID: a.string(), // Related transaction (optional)
      // Define relationships
      customer: a.belongsTo('Customer', 'customerID'), // Keep belongsTo
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      order: a.belongsTo('Order', 'orderID'),
      transaction: a.belongsTo('Transaction', 'transactionID')
    })
    .authorization((allow) => [
      allow.owner(), // Business owner/staff can manage notifications
    ]),

  // CustomerCredit Model
  CustomerCredit: a
    .model({
      id: a.id().required(),
      amount: a.float().required(), // Amount of this credit transaction (+ve for adding, -ve for using)
      balance: a.float().required(), // Running balance after this transaction
      description: a.string().required(), // e.g., 'Store Credit Issued', 'Used for Order #123'
      createdAt: a.datetime().required(),
      customerID: a.string().required(),
      businessID: a.string().required(),
      transactionID: a.string(), // Related transaction where credit was used/issued (optional)
      orderID: a.string(), // Related order where credit was used/issued (optional)
      // Define relationships
      customer: a.belongsTo('Customer', 'customerID'), // Keep belongsTo
      // business: a.belongsTo('Business', 'businessID'), // Keep belongsTo
      transaction: a.belongsTo('Transaction', 'transactionID'),
      order: a.belongsTo('Order', 'orderID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

}); // End of a.schema({...})

// Define the Schema type explicitly for clarity if needed elsewhere
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
});