import { defineRelations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const feeBearerEnum = pgEnum("fee_bearer", ["ORGANIZER", "CUSTOMER"]);
export const eventStatusEnum = pgEnum("event_status", [
  "DRAFT",
  "PUBLISHED",
  "CANCELLED",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "COMPLETED",
  "REFUNDED",
  "EXPIRED",
]);
export const ticketStatusEnum = pgEnum("ticket_status", [
  "VALID",
  "CHECKED_IN",
  "REFUNDED",
]);
export const discountTypeEnum = pgEnum("discount_type", [
  "PERCENTAGE",
  "FIXED",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "PENDING",
  "SUCCESSFUL",
  "FAILED",
]);
export const refundStatusEnum = pgEnum("refund_status", [
  "PENDING",
  "PROCESSED",
  "FAILED",
]);
export const payoutStatusEnum = pgEnum("payout_status", [
  "PENDING",
  "PROCESSING",
  "SUCCESSFUL",
  "FAILED",
]);
export const accountTypeEnum = pgEnum("account_type", [
  "ASSET",
  "LIABILITY",
  "REVENUE",
  "EXPENSE",
]);
export const entryTypeEnum = pgEnum("entry_type", ["DEBIT", "CREDIT"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "ORDER_CONFIRMED",
  "TICKET_READY",
  "EVENT_REMINDER",
  "EVENT_UPDATED",
  "EVENT_CANCELLED",
  "REFUND_PROCESSED",
  "PAYOUT_SENT",
]);

export const user = pgTable("user", {
  id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
);

export const verification = pgTable(
  "verification",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

// ============================================================================
// ORGANIZER
// ============================================================================

export const organizer = pgTable(
  "organizer",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // Bank details for payouts
    bankCode: text("bank_code"),
    accountNumber: text("account_number"),
    accountName: text("account_name"),
    paystackRecipientCode: text("paystack_recipient_code"),
    // Denormalized balances (in kobo)
    availableBalance: bigint("available_balance", { mode: "number" })
      .default(0)
      .notNull(),
    pendingBalance: bigint("pending_balance", { mode: "number" })
      .default(0)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("organizer_ownerId_idx").on(table.ownerId),
    check(
      "organizer_availableBalance_check",
      sql`${table.availableBalance} >= 0`
    ),
    check("organizer_pendingBalance_check", sql`${table.pendingBalance} >= 0`),
  ]
);

// ============================================================================
// EVENT
// ============================================================================

export const event = pgTable(
  "event",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => organizer.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    // Venue details
    address: text("venue_address"),
    // Event timing
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    timezone: text("timezone"),
    // Fee configuration (event-wide)
    feeBearer: feeBearerEnum("fee_bearer").default("CUSTOMER").notNull(),
    // Status
    status: eventStatusEnum("status").default("DRAFT").notNull(),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("event_organizerId_idx").on(table.organizerId),
    uniqueIndex("event_organizerId_slug_idx").on(table.organizerId, table.slug),
    index("event_status_idx").on(table.status),
    index("event_startDate_idx").on(table.startDate),
    check("event_endDate_check", sql`${table.endDate} > ${table.startDate}`),
  ]
);

// ============================================================================
// EVENT BANNER
// ============================================================================

export const eventBanner = pgTable(
  "event_banner",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    blurhash: text("blurhash"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("eventBanner_eventId_idx").on(table.eventId)]
);

// ============================================================================
// TICKET TYPE
// ============================================================================

export const ticketType = pgTable(
  "ticket_type",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: bigint("price", { mode: "number" }).notNull(), // in kobo
    quantity: integer("quantity").notNull(), // total available
    soldCount: integer("sold_count").default(0).notNull(), // denormalized
    salesStartDate: timestamp("sales_start_date"),
    salesEndDate: timestamp("sales_end_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ticketType_eventId_idx").on(table.eventId),
    check("ticketType_price_check", sql`${table.price} >= 0`),
    check("ticketType_quantity_check", sql`${table.quantity} > 0`),
    check("ticketType_soldCount_check", sql`${table.soldCount} >= 0`),
    check(
      "ticketType_soldCount_quantity_check",
      sql`${table.soldCount} <= ${table.quantity}`
    ),
  ]
);

// ============================================================================
// RESERVATION (Ticket Hold)
// ============================================================================

export const reservation = pgTable(
  "reservation",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    // Groups multiple reservations from same checkout session
    groupId: uuid("group_id").notNull(),
    ticketTypeId: uuid("ticket_type_id")
      .notNull()
      .references(() => ticketType.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("reservation_groupId_idx").on(table.groupId),
    index("reservation_ticketTypeId_idx").on(table.ticketTypeId),
    index("reservation_userId_idx").on(table.userId),
    index("reservation_expiresAt_idx").on(table.expiresAt),
    check("reservation_quantity_check", sql`${table.quantity} > 0`),
  ]
);

// ============================================================================
// DISCOUNT CODE
// ============================================================================

export const discountCode = pgTable(
  "discount_code",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    discountType: discountTypeEnum("discount_type").notNull(),
    discountValue: bigint("discount_value", { mode: "number" }).notNull(), // percentage (0-100) or kobo
    maxUses: integer("max_uses"), // null = unlimited
    usedCount: integer("used_count").default(0).notNull(),
    maxUsesPerUser: integer("max_uses_per_user"), // null = unlimited
    minOrderAmount: bigint("min_order_amount", { mode: "number" }), // in kobo, null = none
    validFrom: timestamp("valid_from"),
    validUntil: timestamp("valid_until"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("discountCode_eventId_idx").on(table.eventId),
    uniqueIndex("discountCode_eventId_code_idx").on(table.eventId, table.code),
    check("discountCode_discountValue_check", sql`${table.discountValue} > 0`),
    check("discountCode_usedCount_check", sql`${table.usedCount} >= 0`),
    check(
      "discountCode_minOrderAmount_check",
      sql`${table.minOrderAmount} IS NULL OR ${table.minOrderAmount} >= 0`
    ),
  ]
);

// ============================================================================
// ORDER
// ============================================================================

export const order = pgTable(
  "order",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "restrict" }),
    // Buyer info
    buyerEmail: text("buyer_email").notNull(),
    buyerName: text("buyer_name").notNull(),
    buyerPhone: text("buyer_phone"),
    // Pricing (all in kobo)
    subtotal: bigint("subtotal", { mode: "number" }).notNull(),
    discountAmount: bigint("discount_amount", { mode: "number" })
      .default(0)
      .notNull(),
    platformFee: bigint("platform_fee", { mode: "number" })
      .default(0)
      .notNull(),
    paystackFee: bigint("paystack_fee", { mode: "number" })
      .default(0)
      .notNull(),
    total: bigint("total", { mode: "number" }).notNull(), // what customer pays
    // Discount applied
    discountCodeId: uuid("discount_code_id").references(() => discountCode.id, {
      onDelete: "set null",
    }),
    // Payment reference
    paystackReference: text("paystack_reference"),
    // Status
    status: orderStatusEnum("status").default("PENDING").notNull(),
    completedAt: timestamp("completed_at"),
    expiresAt: timestamp("expires_at"), // for pending orders
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("order_eventId_idx").on(table.eventId),
    index("order_buyerEmail_idx").on(table.buyerEmail),
    index("order_status_idx").on(table.status),
    index("order_paystackReference_idx").on(table.paystackReference),
    check("order_subtotal_check", sql`${table.subtotal} >= 0`),
    check("order_discountAmount_check", sql`${table.discountAmount} >= 0`),
    check("order_platformFee_check", sql`${table.platformFee} >= 0`),
    check("order_paystackFee_check", sql`${table.paystackFee} >= 0`),
    check("order_total_check", sql`${table.total} >= 0`),
  ]
);

// ============================================================================
// ORDER ITEM
// ============================================================================

export const orderItem = pgTable(
  "order_item",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    ticketTypeId: uuid("ticket_type_id")
      .notNull()
      .references(() => ticketType.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(), // snapshot in kobo
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("orderItem_orderId_idx").on(table.orderId),
    index("orderItem_ticketTypeId_idx").on(table.ticketTypeId),
    check("orderItem_quantity_check", sql`${table.quantity} > 0`),
    check("orderItem_unitPrice_check", sql`${table.unitPrice} >= 0`),
  ]
);

// ============================================================================
// TICKET (Individual Entry Pass)
// ============================================================================

export const ticket = pgTable(
  "ticket",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    orderItemId: uuid("order_item_id")
      .notNull()
      .references(() => orderItem.id, { onDelete: "cascade" }),
    ticketTypeId: uuid("ticket_type_id")
      .notNull()
      .references(() => ticketType.id, { onDelete: "restrict" }),
    // Unique code for QR
    code: text("code").notNull().unique(),
    // Attendee info (can be different from buyer)
    attendeeEmail: text("attendee_email"),
    attendeeName: text("attendee_name"),
    // Status
    status: ticketStatusEnum("status").default("VALID").notNull(),
    // Check-in tracking
    checkedInAt: timestamp("checked_in_at"),
    checkedInBy: uuid("checked_in_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("ticket_orderItemId_idx").on(table.orderItemId),
    index("ticket_ticketTypeId_idx").on(table.ticketTypeId),
    uniqueIndex("ticket_code_idx").on(table.code),
    index("ticket_status_idx").on(table.status),
    index("ticket_attendeeEmail_idx").on(table.attendeeEmail),
  ]
);

// ============================================================================
// SAVED EVENT (Bookmarks)
// ============================================================================

export const savedEvent = pgTable(
  "saved_event",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventId: uuid("event_id")
      .notNull()
      .references(() => event.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("savedEvent_userId_idx").on(table.userId),
    uniqueIndex("savedEvent_userId_eventId_idx").on(
      table.userId,
      table.eventId
    ),
  ]
);

// ============================================================================
// NOTIFICATION
// ============================================================================

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    // Optional references for context
    eventId: uuid("event_id").references(() => event.id, {
      onDelete: "set null",
    }),
    orderId: uuid("order_id").references(() => order.id, {
      onDelete: "set null",
    }),
    // Read status
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notification_userId_idx").on(table.userId),
    index("notification_userId_isRead_idx").on(table.userId, table.isRead),
  ]
);

// ============================================================================
// PAYMENT
// ============================================================================

export const payment = pgTable(
  "payment",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "restrict" }),
    paystackReference: text("paystack_reference").notNull().unique(),
    amount: bigint("amount", { mode: "number" }).notNull(), // in kobo
    paystackFee: bigint("paystack_fee", { mode: "number" }), // in kobo
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    paidAt: timestamp("paid_at"),
    metadata: text("metadata"), // JSON string for Paystack response
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payment_orderId_idx").on(table.orderId),
    uniqueIndex("payment_paystackReference_idx").on(table.paystackReference),
    check("payment_amount_check", sql`${table.amount} > 0`),
    check(
      "payment_paystackFee_check",
      sql`${table.paystackFee} IS NULL OR ${table.paystackFee} >= 0`
    ),
  ]
);

// ============================================================================
// REFUND
// ============================================================================

export const refund = pgTable(
  "refund",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    orderId: uuid("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "restrict" }),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payment.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "number" }).notNull(), // full refund amount in kobo
    paystackRefundReference: text("paystack_refund_reference"),
    status: refundStatusEnum("status").default("PENDING").notNull(),
    reason: text("reason"),
    processedAt: timestamp("processed_at"),
    processedBy: uuid("processed_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("refund_orderId_idx").on(table.orderId),
    index("refund_paymentId_idx").on(table.paymentId),
    check("refund_amount_check", sql`${table.amount} > 0`),
  ]
);

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

export const chartOfAccount = pgTable(
  "chart_of_account",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    code: text("code").notNull().unique(), // e.g., "1001", "2001"
    name: text("name").notNull(), // e.g., "Paystack Holdings"
    accountType: accountTypeEnum("account_type").notNull(),
    description: text("description"),
    isSystemAccount: boolean("is_system_account").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("chartOfAccount_code_idx").on(table.code)]
);

// ============================================================================
// TRANSACTION (Groups Ledger Entries)
// ============================================================================

export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    description: text("description").notNull(),
    // Source reference (one of these will be set)
    paymentId: uuid("payment_id").references(() => payment.id, {
      onDelete: "set null",
    }),
    refundId: uuid("refund_id").references(() => refund.id, {
      onDelete: "set null",
    }),
    payoutId: uuid("payout_id"), // Can't reference payout here due to circular dependency
    // Metadata
    metadata: text("metadata"), // JSON string for additional context
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("transaction_paymentId_idx").on(table.paymentId),
    index("transaction_refundId_idx").on(table.refundId),
    index("transaction_payoutId_idx").on(table.payoutId),
  ]
);

// ============================================================================
// LEDGER ENTRY
// ============================================================================

export const ledgerEntry = pgTable(
  "ledger_entry",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transaction.id, { onDelete: "cascade" }),
    accountId: uuid("account_id")
      .notNull()
      .references(() => chartOfAccount.id, { onDelete: "restrict" }),
    entryType: entryTypeEnum("entry_type").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(), // in kobo, always positive
    // Optional organizer reference for organizer-specific entries
    organizerId: uuid("organizer_id").references(() => organizer.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ledgerEntry_transactionId_idx").on(table.transactionId),
    index("ledgerEntry_accountId_idx").on(table.accountId),
    index("ledgerEntry_organizerId_idx").on(table.organizerId),
    check("ledgerEntry_amount_check", sql`${table.amount} > 0`),
  ]
);

// ============================================================================
// PAYOUT
// ============================================================================

export const payout = pgTable(
  "payout",
  {
    id: uuid("id").primaryKey().unique().default(sql`uuidv7()`),
    organizerId: uuid("organizer_id")
      .notNull()
      .references(() => organizer.id, { onDelete: "restrict" }),
    amount: bigint("amount", { mode: "number" }).notNull(), // in kobo
    paystackTransferReference: text("paystack_transfer_reference"),
    paystackTransferCode: text("paystack_transfer_code"),
    status: payoutStatusEnum("status").default("PENDING").notNull(),
    transactionId: uuid("transaction_id").references(() => transaction.id, {
      onDelete: "set null",
    }),
    processedAt: timestamp("processed_at"),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("payout_organizerId_idx").on(table.organizerId),
    index("payout_status_idx").on(table.status),
    check("payout_amount_check", sql`${table.amount} > 0`),
  ]
);

// ============================================================================
// RELATIONS (v2 syntax)
// ============================================================================

export const relations = defineRelations(
  {
    user,
    session,
    account,
    verification,
    organizer,
    event,
    eventBanner,
    ticketType,
    reservation,
    discountCode,
    order,
    orderItem,
    ticket,
    savedEvent,
    notification,
    payment,
    refund,
    chartOfAccount,
    transaction,
    ledgerEntry,
    payout,
  },
  (r) => ({
    // User relations
    user: {
      sessions: r.many.session(),
      accounts: r.many.account(),
      organizers: r.many.organizer(),
      reservations: r.many.reservation(),
      savedEvents: r.many.savedEvent(),
      notifications: r.many.notification(),
    },

    // Session relations
    session: {
      user: r.one.user({
        from: r.session.userId,
        to: r.user.id,
      }),
    },

    // Account relations
    account: {
      user: r.one.user({
        from: r.account.userId,
        to: r.user.id,
      }),
    },

    // Organizer relations
    organizer: {
      owner: r.one.user({
        from: r.organizer.ownerId,
        to: r.user.id,
      }),
      events: r.many.event(),
      payouts: r.many.payout(),
      ledgerEntries: r.many.ledgerEntry(),
    },

    // Event relations
    event: {
      organizer: r.one.organizer({
        from: r.event.organizerId,
        to: r.organizer.id,
      }),
      banners: r.many.eventBanner(),
      ticketTypes: r.many.ticketType(),
      discountCodes: r.many.discountCode(),
      orders: r.many.order(),
      savedBy: r.many.savedEvent(),
      notifications: r.many.notification(),
    },

    // Event Banner relations
    eventBanner: {
      event: r.one.event({
        from: r.eventBanner.eventId,
        to: r.event.id,
      }),
    },

    // Ticket Type relations
    ticketType: {
      event: r.one.event({
        from: r.ticketType.eventId,
        to: r.event.id,
      }),
      reservations: r.many.reservation(),
      orderItems: r.many.orderItem(),
      tickets: r.many.ticket(),
    },

    // Reservation relations
    reservation: {
      ticketType: r.one.ticketType({
        from: r.reservation.ticketTypeId,
        to: r.ticketType.id,
      }),
      user: r.one.user({
        from: r.reservation.userId,
        to: r.user.id,
      }),
    },

    // Discount Code relations
    discountCode: {
      event: r.one.event({
        from: r.discountCode.eventId,
        to: r.event.id,
      }),
      orders: r.many.order(),
    },

    // Order relations
    order: {
      event: r.one.event({
        from: r.order.eventId,
        to: r.event.id,
      }),
      discountCode: r.one.discountCode({
        from: r.order.discountCodeId,
        to: r.discountCode.id,
      }),
      orderItems: r.many.orderItem(),
      payments: r.many.payment(),
      refunds: r.many.refund(),
      notifications: r.many.notification(),
    },

    // Order Item relations
    orderItem: {
      order: r.one.order({
        from: r.orderItem.orderId,
        to: r.order.id,
      }),
      ticketType: r.one.ticketType({
        from: r.orderItem.ticketTypeId,
        to: r.ticketType.id,
      }),
      tickets: r.many.ticket(),
    },

    // Ticket relations
    ticket: {
      orderItem: r.one.orderItem({
        from: r.ticket.orderItemId,
        to: r.orderItem.id,
      }),
      ticketType: r.one.ticketType({
        from: r.ticket.ticketTypeId,
        to: r.ticketType.id,
      }),
      checkedInByUser: r.one.user({
        from: r.ticket.checkedInBy,
        to: r.user.id,
      }),
    },

    // Saved Event relations
    savedEvent: {
      user: r.one.user({
        from: r.savedEvent.userId,
        to: r.user.id,
      }),
      event: r.one.event({
        from: r.savedEvent.eventId,
        to: r.event.id,
      }),
    },

    // Notification relations
    notification: {
      user: r.one.user({
        from: r.notification.userId,
        to: r.user.id,
      }),
      event: r.one.event({
        from: r.notification.eventId,
        to: r.event.id,
      }),
      order: r.one.order({
        from: r.notification.orderId,
        to: r.order.id,
      }),
    },

    // Payment relations
    payment: {
      order: r.one.order({
        from: r.payment.orderId,
        to: r.order.id,
      }),
      refunds: r.many.refund(),
      transactions: r.many.transaction(),
    },

    // Refund relations
    refund: {
      order: r.one.order({
        from: r.refund.orderId,
        to: r.order.id,
      }),
      payment: r.one.payment({
        from: r.refund.paymentId,
        to: r.payment.id,
      }),
      processedByUser: r.one.user({
        from: r.refund.processedBy,
        to: r.user.id,
      }),
      transactions: r.many.transaction(),
    },

    // Chart of Account relations
    chartOfAccount: {
      ledgerEntries: r.many.ledgerEntry(),
    },

    // Transaction relations
    transaction: {
      payment: r.one.payment({
        from: r.transaction.paymentId,
        to: r.payment.id,
      }),
      refund: r.one.refund({
        from: r.transaction.refundId,
        to: r.refund.id,
      }),
      ledgerEntries: r.many.ledgerEntry(),
      payout: r.one.payout({
        from: r.transaction.payoutId,
        to: r.payout.id,
      }),
    },

    // Ledger Entry relations
    ledgerEntry: {
      transaction: r.one.transaction({
        from: r.ledgerEntry.transactionId,
        to: r.transaction.id,
      }),
      account: r.one.chartOfAccount({
        from: r.ledgerEntry.accountId,
        to: r.chartOfAccount.id,
      }),
      organizer: r.one.organizer({
        from: r.ledgerEntry.organizerId,
        to: r.organizer.id,
      }),
    },

    // Payout relations
    payout: {
      organizer: r.one.organizer({
        from: r.payout.organizerId,
        to: r.organizer.id,
      }),
      transaction: r.one.transaction({
        from: r.payout.transactionId,
        to: r.transaction.id,
      }),
    },
  })
);
