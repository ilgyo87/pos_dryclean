import { a, defineData, type ClientSchema } from "@aws-amplify/backend";

const schema = a.schema({
  Business: a
    .model({
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
      hours: a.string(),
      logoUrl: a.url(),
      industry: a.string(),
      establishedDate: a.date(),
      taxId: a.string(),
      isActive: a.boolean().default(true),
      userId: a.string(),
      qrCode: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  Category: a
    .model({
      name: a.string().required(),
      description: a.string(),
      businessID: a.id().required(),
      price: a.float(),
      items: a.hasMany('Item', 'categoryID'),
      imageUrl: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  Item: a
    .model({
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      duration: a.integer(),
      sku: a.string(),
      taxable: a.boolean().default(true),
      imageUrl: a.url(),
      businessID: a.id().required(),
      categoryID: a.id().required(),
      category: a.belongsTo('Category', 'categoryID'),
      orderItems: a.hasMany('OrderItem', 'itemID'),
      transactionItems: a.hasMany('TransactionItem', 'itemID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  Customer: a
    .model({
      cognitoUserId: a.string(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phone: a.phone(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      notes: a.string(),
      lastActiveDate: a.date(),
      preferences: a.string(),
      businessID: a.id().required(),
      qrCode: a.string(),
      orders: a.hasMany('Order', 'customerID'),
      garments: a.hasMany('Garment', 'customerID'),
      transactions: a.hasMany('Transaction', 'customerID'),
      notifications: a.hasMany('CustomerNotification', 'customerID'),
      credits: a.hasMany('CustomerCredit', 'customerID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  Employee: a
    .model({
      cognitoUserId: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email().required(),
      phoneNumber: a.phone().required(),
      role: a.string().required(),
      hourlyRate: a.float(),
      hireDate: a.datetime(),
      status: a.string(),
      permissions: a.string(),
      businessID: a.id().required(),
      transactions: a.hasMany("Transaction", "employeeID"),
      shifts: a.hasMany("EmployeeShift", "employeeID"),
      qrCode: a.string(),
      lastLogin: a.datetime(),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  EmployeeShift: a
    .model({
      employeeID: a.id().required(),
      employee: a.belongsTo("Employee", "employeeID"),
      businessID: a.id().required(),
      clockIn: a.datetime().required(),
      clockOut: a.datetime(),
      duration: a.float(),
      status: a.string(),
      notes: a.string()
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  Garment: a
    .model({
      description: a.string().required(),
      type: a.string().required(),
      brand: a.string(),
      size: a.string(),
      color: a.string(),
      material: a.string(),
      notes: a.string(),
      imageUrl: a.url(),
      qrCode: a.string(),
      status: a.string().required().default('Checked In'),
      checkInDate: a.datetime().required(),
      readyDate: a.datetime(),
      claimedDate: a.datetime(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      orderItemID: a.id(),
      customer: a.belongsTo('Customer', 'customerID'),
      orderItem: a.belongsTo('OrderItem', 'orderItemID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  // Temporary model for Order modal
  Transaction: a
    .model({
      transactionNumber: a.string().required(),
      transactionDate: a.datetime().required(),
      status: a.string().required(),
      subtotal: a.float().required(),
      tax: a.float().required(),
      discount: a.float(),
      total: a.float().required(),
      paymentMethod: a.string().required(),
      paymentStatus: a.string().required(),
      notes: a.string(),
      receiptUrl: a.url(),
      externalTransactionId: a.string(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      employeeID: a.id(),
      orderID: a.id(),
      qrCode: a.string(),
      pickupDate: a.datetime(),
      customerPreferences: a.string(),
      customer: a.belongsTo('Customer', 'customerID'),
      employee: a.belongsTo('Employee', 'employeeID'),
      order: a.belongsTo('Order', 'orderID'),
      transactionItems: a.hasMany('TransactionItem', 'transactionID'),
      credits: a.hasMany('CustomerCredit', 'transactionID'),
      notifications: a.hasMany('CustomerNotification', 'transactionID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  TransactionItem: a
    .model({
      quantity: a.integer().required(),
      priceAtTransaction: a.float().required(),
      transactionID: a.id().required(),
      itemID: a.id().required(),
      orderItemID: a.id(),
      transaction: a.belongsTo('Transaction', 'transactionID'),
      item: a.belongsTo('Item', 'itemID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  Order: a
    .model({
      orderNumber: a.string().required(),
      orderDate: a.datetime().required(),
      dueDate: a.datetime(),
      status: a.string().required(),
      notes: a.string(),
      estimatedTotal: a.float(),
      actualTotal: a.float(),
      priority: a.integer().default(0),
      qrCode: a.string(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      employeeID: a.id(),
      customer: a.belongsTo('Customer', 'customerID'),
      orderItems: a.hasMany('OrderItem', 'orderID'),
      transactions: a.hasMany('Transaction', 'orderID'),
      notifications: a.hasMany('CustomerNotification', 'orderID'),
      credits: a.hasMany('CustomerCredit', 'orderID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  OrderItem: a
    .model({
      quantity: a.integer().required(),
      priceAtOrder: a.float().required(),
      status: a.string(),
      notes: a.string(),
      orderID: a.id().required(),
      itemID: a.id().required(),
      garmentID: a.id(),
      order: a.belongsTo('Order', 'orderID'),
      item: a.belongsTo('Item', 'itemID'),
      garment: a.hasOne('Garment', 'orderItemID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

  CustomerNotification: a
    .model({
      message: a.string().required(),
      type: a.string().required(),
      status: a.string().required(),
      sentAt: a.datetime().required(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      orderID: a.id(),
      transactionID: a.id(),
      customer: a.belongsTo('Customer', 'customerID'),
      order: a.belongsTo('Order', 'orderID'),
      transaction: a.belongsTo('Transaction', 'transactionID')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  CustomerCredit: a
    .model({
      amount: a.float().required(),
      balance: a.float().required(),
      description: a.string().required(),
      createdAt: a.datetime().required(),
      customerID: a.id().required(),
      businessID: a.id().required(),
      transactionID: a.id(),
      orderID: a.id(),
      customer: a.belongsTo('Customer', 'customerID'),
      transaction: a.belongsTo('Transaction', 'transactionID'),
      order: a.belongsTo('Order', 'orderID')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(['read', 'update', 'delete', 'create']),
    ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
});