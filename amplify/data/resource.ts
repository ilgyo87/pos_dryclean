import { a, defineData, type ClientSchema } from "@aws-amplify/backend";
import { fetchBusiness } from "../functions/fetch-business/resource";
import { fetchCustomers } from "../functions/fetch-customers/resource";
import { fetchAllBusinesses } from "../functions/fetch-all-businesses/resource";

const schema = a.schema({

  // Custom Types
  Location: a.customType({
    lat: a.float(),
    long: a.float(),
  }),
  // Core Business Entity
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
      coordinates: a.ref("Location"),
      email: a.email(),
      website: a.url(),
      hours: a.string().array(),
      logoUrl: a.url(),
      userId: a.string(),
      // Relationships
      businessMetrics: a.hasMany("BusinessMetric", "businessId")
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.owner(),
    ]),

  // Service Categories
  Category: a
    .model({
      name: a.string().required(),
      description: a.string(),
      price: a.float(),
      imageUrl: a.string(),
      userId: a.id().required(),
      pressOnlyPrice: a.float().default(0),
      pressOnly: a.boolean().default(false),
      pressOnlyPercent: a.float().default(0),
      discount: a.boolean().default(false),
      discountPercent: a.float().default(0),
      // Relationships
      items: a.hasMany("Item", "categoryId")
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Category Items
  Item: a
    .model({
      name: a.string().required(),
      description: a.string(),
      price: a.float().required(),
      duration: a.integer(),
      taxable: a.boolean().default(false),
      imageUrl: a.url(),
      imageSource: a.string(),
      imageUrlPreferred: a.boolean().default(false),
      starch: a.enum(["NONE", "LIGHT", "MEDIUM", "HEAVY"]),
      pressOnly: a.boolean().default(false),
      discountPrice: a.float().default(0),
      // Relationships
      categoryId: a.id().required(),
      category: a.belongsTo("Category", "categoryId"),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Customer Management
  Customer: a
    .model({
      cognitoUserId: a.string(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phoneNumber: a.phone().required(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      notes: a.string().array(),
      lastActiveDate: a.date(),
      preferences: a.string().array(),
      userId: a.id().required(),
      // Relationships
      // orders: a.hasMany('Order', 'customerId'),
      garments: a.hasMany("Garment", "customerId"),
      // notifications: a.hasMany('CustomerNotification', 'customerId'),
      // credits: a.hasMany('CustomerCredit', 'customerId'),
      // deliveryAddresses: a.hasMany('DeliveryAddress', 'customerId'),
      // transactions: a.hasMany('Transaction', 'customerId'),
      // loyaltyMembership: a.hasOne('CustomerLoyaltyMembership', 'customerId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Delivery Address for multiple customer locations
  DeliveryAddress: a
    .model({
      name: a.string().required(), // Home, Office, etc.
      address: a.string().required(),
      city: a.string().required(),
      state: a.string().required(),
      zipCode: a.string().required(),
      instructions: a.string().array(),
      isDefault: a.boolean().default(false),
      coordinates: a.ref("Location"),
      // Relationships
      // customerId: a.id().required(),
      // customer: a.belongsTo('Customer', 'customerId'),
      // orders: a.hasMany('Order', 'deliveryAddressId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Employee Management
  Employee: a
    .model({
      firstName: a.string().required(),
      lastName: a.string().required(),
      email: a.email(),
      phoneNumber: a.phone().required(),
      address: a.string(),
      city: a.string(),
      state: a.string(),
      zipCode: a.string(),
      role: a.string().required(),
      hourlyRate: a.float(),
      hireDate: a.datetime(),
      status: a.enum(["ACTIVE", "INACTIVE", "ON_LEAVE"]),
      permissions: a.string(),
      lastLogin: a.datetime(),
      userId: a.id().required(),
      pinCode: a.string().required(),
      // Relationships
      // orders: a.hasMany('Order', 'employeeId'),
      // transactions: a.hasMany('Transaction', 'employeeId'),
      employeeShifts: a.hasMany("EmployeeShift", "employeeId"),
      // garmentProcessingEvents: a.hasMany('GarmentProcessingEvent', 'employeeId'),
      // garments: a.hasMany('Garment', 'employeeId'),
      // businessMetrics: a.hasMany('BusinessMetric', 'employeeId'),
      // inventoryTransactions: a.hasMany('InventoryTransaction', 'employeeId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Employee Shift Tracking
  EmployeeShift: a
    .model({
      clockIn: a.datetime().required(),
      clockOut: a.datetime(),
      duration: a.float(),
      status: a.enum(["ACTIVE", "COMPLETED", "MODIFIED"]),
      notes: a.string().array(),
      // Relationships
      employeeId: a.id().required(),
      employee: a.belongsTo("Employee", "employeeId"),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated().to(["read"]),
    ]),

  // Garment Management
  Garment: a
    .model({
      description: a.string(),
      type: a.string(),
      brand: a.string(),
      size: a.string(),
      color: a.string(),
      material: a.string(),
      notes: a.string().array(),
      imageUrl: a.url() || a.string(),
      status: a.enum([
        "CHECKED_IN",
        "IN_PROCESS",
        "CLEANING",
        "PRESSING",
        "ASSEMBLY",
        "READY",
        "CLAIMED"
      ]),
      checkInDate: a.datetime().required(),
      targetReadyDate: a.datetime(),
      actualReadyDate: a.datetime(),
      claimedDate: a.datetime(),
      specialInstructions: a.string().array(),
      starch: a.enum(["NONE", "LIGHT", "MEDIUM", "HEAVY"]),
      pressOnly: a.boolean().default(false),
      // Relationships
      customerId: a.id().required(),
      customer: a.belongsTo("Customer", "customerId"),
      orderItemId: a.id(),
      // orderItem: a.belongsTo('OrderItem', 'orderItemId'),
      orderId: a.id(),
      // order: a.belongsTo('Order', 'orderId'),
      employeeId: a.id(),
      // employee: a.belongsTo('Employee', 'employeeId'),
      garmentProcessingEvents: a.hasMany("GarmentProcessingEvent", "garmentId")
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Garment Processing Event (for tracking status changes)
  GarmentProcessingEvent: a
    .model({
      eventType: a.enum([
        "CHECK_IN",
        "STAIN_TREATMENT",
        "CLEANING_START",
        "CLEANING_COMPLETE",
        "PRESSING_START",
        "PRESSING_COMPLETE",
        "ASSEMBLY",
        "READY_FOR_PICKUP",
        "CLAIMED"
      ]),
      timestamp: a.datetime().required(),
      notes: a.string().array(),
      imageUrl: a.url(),
      // Relationships
      garmentId: a.id().required(),
      garment: a.belongsTo("Garment", "garmentId"),
      // employeeId: a.id(),
      // employee: a.belongsTo('Employee', 'employeeId'),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Order Management
  Order: a
    .model({
      orderNumber: a.string().required(),
      orderDate: a.datetime().required(),
      dueDate: a.datetime(),
      pickupDate: a.datetime(),
      status: a.enum([
        "CREATED",
        "PROCESSING",
        "READY",
        "COMPLETED",
        "CANCELLED",
        "DELIVERY_SCHEDULED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED"
      ]),
      notes: a.string().array(),
      subtotal: a.float(),
      tax: a.float(),
      tip: a.float(),
      total: a.float(),
      discount: a.float().default(0),
      amountTendered: a.float(),
      change: a.float(),
      paymentMethod: a.string(),
      additionalCharges: a.float().default(0),
      priority: a.integer().default(0),
      // Delivery specific fields
      isDelivery: a.boolean().default(false),
      deliveryDate: a.datetime(),
      deliveryFee: a.float().default(0),
      deliveryStatus: a.enum([
        "NOT_APPLICABLE",
        "SCHEDULED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED"
      ]),
      deliveryNotes: a.string().array(),
      // Relationships
      businessId: a.id(),
      customerId: a.id(),
      employeeName: a.string(),
      firstName: a.string(),
      lastName: a.string(),
      // customer: a.belongsTo('Customer', 'customerId'),
      employeeId: a.id(),
      // employee: a.belongsTo('Employee', 'employeeId'),
      deliveryAddressId: a.id(),
      // deliveryAddress: a.belongsTo('DeliveryAddress', 'deliveryAddressId'),
      orderItems: a.hasMany("OrderItem", "orderId"),
      // garments: a.hasMany('Garment', 'orderId'),
      transactionId: a.id(),
      // transaction: a.belongsTo('Transaction', 'transactionId'),
      // customerNotifications: a.hasMany('CustomerNotification', 'orderId'),
      // credits: a.hasMany('CustomerCredit', 'orderId'),
      // loyaltyTransactions: a.hasMany('LoyaltyTransaction', 'orderId')
    })
    .authorization((allow) => [
      allow.owner(),
      allow.authenticated(),
    ]),

  // Order Items
  OrderItem: a
    .model({
      price: a.float().required(),
      duration: a.integer(),
      taxable: a.boolean().default(false),
      notes: a.string().array(),
      specialInstructions: a.string().array(),
      orderNumber: a.string().required(),
      itemName: a.string(),
      starch: a.enum(["NONE", "LIGHT", "MEDIUM", "HEAVY"]),
      pressOnly: a.boolean().default(false),
      // Relationships
      orderId: a.id().required(),
      order: a.belongsTo("Order", "orderId"),
      // itemId: a.id().required(),
      // item: a.belongsTo('Item', 'itemId'),
      // garment: a.hasOne('Garment', 'orderItemId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Financial Transactions
  Transaction: a
    .model({
      type: a.enum([
        "SALE",
        "REFUND",
        "PARTIAL_PAYMENT",
        "DEPOSIT",
        "ADJUSTMENT"
      ]),
      status: a.enum([
        "PENDING",
        "COMPLETED",
        "FAILED",
        "REFUNDED",
        "VOIDED"
      ]),
      subtotal: a.float(),
      tax: a.float(),
      discount: a.float().default(0),
      total: a.float().required(),
      paymentMethod: a.enum([
        "CASH",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "MOBILE_PAYMENT",
        "STORE_CREDIT",
        "CHECK",
        "INVOICE"
      ]),
      paymentStatus: a.string(),
      notes: a.string().array(),
      receiptUrl: a.url(),
      externalTransactionId: a.string(),
      // Relationships
      // customerId: a.id().required(),
      // customer: a.belongsTo('Customer', 'customerId'),
      // employeeId: a.id(),
      // employee: a.belongsTo('Employee', 'employeeId'),
      // order: a.hasOne('Order', 'transactionId'),
      // notifications: a.hasMany('CustomerNotification', 'transactionId'),
      // credits: a.hasMany('CustomerCredit', 'transactionId'),
      // loyaltyTransactions: a.hasMany('LoyaltyTransaction', 'transactionId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Customer Notifications
  CustomerNotification: a
    .model({
      message: a.string().required(),
      type: a.enum([
        "ORDER_CREATED",
        "ORDER_READY",
        "ORDER_DELIVERED",
        "PAYMENT_CONFIRMATION",
        "GARMENT_ISSUE",
        "PROMOTIONAL",
        "REMINDER"
      ]),
      status: a.enum([
        "PENDING",
        "SENT",
        "DELIVERED",
        "FAILED",
        "READ"
      ]),
      channel: a.enum([
        "EMAIL",
        "SMS",
        "PUSH",
        "IN_APP"
      ]),
      sentAt: a.datetime().required(),
      deliveredAt: a.datetime(),
      readAt: a.datetime(),
      // Relationships
      // customerId: a.id().required(),
      // customer: a.belongsTo('Customer', 'customerId'),
      // orderId: a.id(),
      // order: a.belongsTo('Order', 'orderId'),
      // transactionId: a.id(),
      // transaction: a.belongsTo('Transaction', 'transactionId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Customer Credits/Rewards
  CustomerCredit: a
    .model({
      amount: a.float().required(),
      balance: a.float().required(),
      type: a.enum([
        "STORE_CREDIT",
        "REFUND",
        "PROMOTIONAL",
        "LOYALTY_REWARD",
        "ADJUSTMENT"
      ]),
      description: a.string(),
      expirationDate: a.date(),
      createdAt: a.datetime().required(),
      // Relationships
      // customerId: a.id().required(),
      // customer: a.belongsTo('Customer', 'customerId'),
      // orderId: a.id(),
      // order: a.belongsTo('Order', 'orderId'),
      // transactionId: a.id(),
      // transaction: a.belongsTo('Transaction', 'transactionId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Loyalty Program
  LoyaltyProgram: a
    .model({
      name: a.string().required(),
      description: a.string(),
      pointsPerDollar: a.float().required().default(1),
      pointsPerVisit: a.integer().default(0),
      minimumPointsRedemption: a.integer().required().default(100),
      pointValueInCents: a.float().required().default(1),
      isActive: a.boolean().default(true),
      // Relationships
      // loyaltyTiers: a.hasMany('LoyaltyTier', 'loyaltyProgramId'),
      // customerLoyaltyMemberships: a.hasMany('CustomerLoyaltyMembership', 'loyaltyProgramId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Loyalty Tiers
  LoyaltyTier: a
    .model({
      name: a.string().required(),
      description: a.string(),
      minimumPoints: a.integer().required(),
      multiplier: a.float().required().default(1),
      benefits: a.string(),
      // Relationships
      // nextTierId: a.id(),
      // nextTier: a.belongsTo('LoyaltyTier', 'nextTierId'),
      // memberships: a.hasMany('CustomerLoyaltyMembership', 'currentTierId'),
      // previousTier: a.hasOne('LoyaltyTier', 'nextTierId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Customer Loyalty Membership
  CustomerLoyaltyMembership: a
    .model({
      pointsBalance: a.integer().required().default(0),
      lifetimePoints: a.integer().required().default(0),
      currentTierID: a.id(),
      enrollmentDate: a.datetime().required(),
      lastActivityDate: a.datetime(),
      // Relationships
      // currentTierId: a.id(),
      // loyaltyTier: a.belongsTo('LoyaltyTier', 'currentTierId'),
      // loyaltyTransactions: a.hasMany('LoyaltyTransaction', 'customerLoyaltyMembershipId')
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Loyalty Transaction
  LoyaltyTransaction: a
    .model({
      type: a.enum([
        "EARN",
        "REDEEM",
        "ADJUST",
        "EXPIRE",
        "TIER_CHANGE"
      ]),
      points: a.integer().required(),
      description: a.string().required(),
      timestamp: a.datetime().required(),
      // Relationships
      // customerLoyaltyMembershipId: a.id().required(),
      // customerLoyaltyMembership: a.belongsTo('CustomerLoyaltyMembership', 'customerLoyaltyMembershipId'),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Reporting
  BusinessMetric: a
    .model({
      date: a.date().required(),
      metric: a.enum([
        "DAILY_SALES",
        "ITEMS_PROCESSED",
        "NEW_CUSTOMERS",
        "REPEAT_CUSTOMERS",
        "AVERAGE_ORDER_VALUE",
        "GARMENTS_PROCESSED",
        "LABOR_COSTS",
        "SUPPLY_COSTS"
      ]),
      value: a.float().required(),
      notes: a.string(),
      // Relationships
      businessId: a.id(),
      business: a.belongsTo("Business", "businessId")
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Inventory Management
  InventoryItem: a
    .model({
      name: a.string().required(),
      description: a.string(),
      category: a.enum([
        "CLEANING_SUPPLY",
        "PACKAGING",
        "OFFICE_SUPPLY",
        "MACHINE_PART",
        "OTHER"
      ]),
      sku: a.string(),
      currentStock: a.integer().required().default(0),
      minimumStock: a.integer().default(0),
      unitPrice: a.float(),
      vendor: a.string(),
      lastOrderDate: a.date(),
      lastCountDate: a.date(),
      // Relationships
      inventoryTransactions: a.hasMany("InventoryTransaction", "inventoryItemId")
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // Inventory Transactions
  InventoryTransaction: a
    .model({
      type: a.enum([
        "PURCHASE",
        "USE",
        "ADJUSTMENT",
        "COUNT",
        "TRANSFER"
      ]),
      quantity: a.integer().required(),
      date: a.datetime().required(),
      notes: a.string(),
      invoiceNumber: a.string(),
      costPerUnit: a.float(),
      // Relationships
      inventoryItemId: a.id().required(),
      inventoryItem: a.belongsTo("InventoryItem", "inventoryItemId"),
    })
    .authorization((allow) => [
      allow.owner(),
    ]),

  // QUERIES
  fetchBusiness: a
    .query()
    .arguments({
      userId: a.id().required()
    })
    .returns(a.ref("Business"))
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(fetchBusiness)),

  fetchCustomers: a
    .query()
    .arguments({
      userId: a.id().required()
    })
    .returns(a.ref("Customer").array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(fetchCustomers)),

  fetchAllBusinesses: a
    .query()
    .returns(a.string().array())
    .authorization(allow => [allow.authenticated()])
    .handler(a.handler.function(fetchAllBusinesses)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool"
  }
});