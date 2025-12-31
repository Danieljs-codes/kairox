-- Add new schema named "drizzle"
CREATE SCHEMA "drizzle";
-- Add new schema named "public"
CREATE SCHEMA IF NOT EXISTS "public";
-- Set comment to schema: "public"
COMMENT ON SCHEMA "public" IS 'standard public schema';
-- Create enum type "payment_status"
CREATE TYPE "public"."payment_status" AS ENUM ('PENDING', 'SUCCESSFUL', 'FAILED');
-- Create enum type "refund_status"
CREATE TYPE "public"."refund_status" AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
-- Create enum type "discount_type"
CREATE TYPE "public"."discount_type" AS ENUM ('PERCENTAGE', 'FIXED');
-- Create enum type "entry_type"
CREATE TYPE "public"."entry_type" AS ENUM ('DEBIT', 'CREDIT');
-- Create enum type "event_status"
CREATE TYPE "public"."event_status" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED');
-- Create enum type "fee_bearer"
CREATE TYPE "public"."fee_bearer" AS ENUM ('ORGANIZER', 'CUSTOMER');
-- Create enum type "notification_type"
CREATE TYPE "public"."notification_type" AS ENUM ('ORDER_CONFIRMED', 'TICKET_READY', 'EVENT_REMINDER', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'REFUND_PROCESSED', 'PAYOUT_SENT');
-- Create enum type "order_status"
CREATE TYPE "public"."order_status" AS ENUM ('PENDING', 'COMPLETED', 'REFUNDED', 'EXPIRED');
-- Create enum type "account_type"
CREATE TYPE "public"."account_type" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE');
-- Create "user" table
CREATE TABLE "public"."user" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "name" text NOT NULL,
  "email" text NOT NULL,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "user_email_key" UNIQUE ("email")
);
-- Add post-creation unique constraints to the "user" table
ALTER TABLE "public"."user" ADD CONSTRAINT "user_id_key" UNIQUE ("id");
-- Create enum type "payout_status"
CREATE TYPE "public"."payout_status" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED');
-- Create enum type "ticket_status"
CREATE TYPE "public"."ticket_status" AS ENUM ('VALID', 'CHECKED_IN', 'REFUNDED');
-- Create "__drizzle_migrations" table
CREATE TABLE "drizzle"."__drizzle_migrations" (
  "id" serial NOT NULL,
  "hash" text NOT NULL,
  "created_at" bigint NULL,
  PRIMARY KEY ("id")
);
-- Create "verification" table
CREATE TABLE "public"."verification" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id")
);
-- Create index "verification_identifier_idx" to table: "verification"
CREATE INDEX "verification_identifier_idx" ON "public"."verification" ("identifier");
-- Add post-creation unique constraints to the "verification" table
ALTER TABLE "public"."verification" ADD CONSTRAINT "verification_id_key" UNIQUE ("id");
-- Create "account" table
CREATE TABLE "public"."account" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" uuid NOT NULL,
  "access_token" text NULL,
  "refresh_token" text NULL,
  "id_token" text NULL,
  "access_token_expires_at" timestamp NULL,
  "refresh_token_expires_at" timestamp NULL,
  "scope" text NULL,
  "password" text NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "account_userId_idx" to table: "account"
CREATE INDEX "account_userId_idx" ON "public"."account" ("user_id");
-- Add post-creation unique constraints to the "account" table
ALTER TABLE "public"."account" ADD CONSTRAINT "account_id_key" UNIQUE ("id");
-- Create "organizer" table
CREATE TABLE "public"."organizer" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "owner_id" uuid NOT NULL,
  "name" text NOT NULL,
  "bank_code" text NULL,
  "account_number" text NULL,
  "account_name" text NULL,
  "paystack_recipient_code" text NULL,
  "available_balance" bigint NOT NULL DEFAULT 0,
  "pending_balance" bigint NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "organizer_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "organizer_availableBalance_check" CHECK (available_balance >= 0),
  CONSTRAINT "organizer_pendingBalance_check" CHECK (pending_balance >= 0)
);
-- Create index "organizer_ownerId_idx" to table: "organizer"
CREATE INDEX "organizer_ownerId_idx" ON "public"."organizer" ("owner_id");
-- Add post-creation unique constraints to the "organizer" table
ALTER TABLE "public"."organizer" ADD CONSTRAINT "organizer_id_key" UNIQUE ("id");
-- Create "event" table
CREATE TABLE "public"."event" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "organizer_id" uuid NOT NULL,
  "title" text NOT NULL,
  "slug" text NOT NULL,
  "description" text NULL,
  "venue_address" text NOT NULL,
  "start_date" timestamp NOT NULL,
  "end_date" timestamp NOT NULL,
  "timezone" text NOT NULL,
  "status" "public"."event_status" NOT NULL DEFAULT 'DRAFT',
  "published_at" timestamp NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "event_organizer_id_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizer" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "event_endDate_check" CHECK (end_date > start_date)
);
-- Create index "event_organizerId_idx" to table: "event"
CREATE INDEX "event_organizerId_idx" ON "public"."event" ("organizer_id");
-- Create index "event_organizerId_slug_idx" to table: "event"
CREATE UNIQUE INDEX "event_organizerId_slug_idx" ON "public"."event" ("organizer_id", "slug");
-- Create index "event_startDate_idx" to table: "event"
CREATE INDEX "event_startDate_idx" ON "public"."event" ("start_date");
-- Create index "event_status_idx" to table: "event"
CREATE INDEX "event_status_idx" ON "public"."event" ("status");
-- Add post-creation unique constraints to the "event" table
ALTER TABLE "public"."event" ADD CONSTRAINT "event_id_key" UNIQUE ("id");
-- Create "discount_code" table
CREATE TABLE "public"."discount_code" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "event_id" uuid NOT NULL,
  "code" text NOT NULL,
  "discount_type" "public"."discount_type" NOT NULL,
  "discount_value" bigint NOT NULL,
  "max_uses" integer NULL,
  "used_count" integer NOT NULL DEFAULT 0,
  "max_uses_per_user" integer NULL,
  "min_order_amount" bigint NULL,
  "valid_from" timestamp NULL,
  "valid_until" timestamp NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "discount_code_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "discountCode_discountValue_check" CHECK (discount_value > 0),
  CONSTRAINT "discountCode_minOrderAmount_check" CHECK ((min_order_amount IS NULL) OR (min_order_amount >= 0)),
  CONSTRAINT "discountCode_usedCount_check" CHECK (used_count >= 0)
);
-- Create index "discountCode_eventId_code_idx" to table: "discount_code"
CREATE UNIQUE INDEX "discountCode_eventId_code_idx" ON "public"."discount_code" ("event_id", "code");
-- Create index "discountCode_eventId_idx" to table: "discount_code"
CREATE INDEX "discountCode_eventId_idx" ON "public"."discount_code" ("event_id");
-- Add post-creation unique constraints to the "discount_code" table
ALTER TABLE "public"."discount_code" ADD CONSTRAINT "discount_code_id_key" UNIQUE ("id");
-- Create "event_banner" table
CREATE TABLE "public"."event_banner" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "event_id" uuid NOT NULL,
  "url" text NOT NULL,
  "blurhash" text NULL,
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "event_banner_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "eventBanner_eventId_idx" to table: "event_banner"
CREATE INDEX "eventBanner_eventId_idx" ON "public"."event_banner" ("event_id");
-- Add post-creation unique constraints to the "event_banner" table
ALTER TABLE "public"."event_banner" ADD CONSTRAINT "event_banner_id_key" UNIQUE ("id");
-- Create "chart_of_account" table
CREATE TABLE "public"."chart_of_account" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "code" text NOT NULL,
  "name" text NOT NULL,
  "account_type" "public"."account_type" NOT NULL,
  "description" text NULL,
  "is_system_account" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "chart_of_account_code_key" UNIQUE ("code")
);
-- Create index "chartOfAccount_code_idx" to table: "chart_of_account"
CREATE UNIQUE INDEX "chartOfAccount_code_idx" ON "public"."chart_of_account" ("code");
-- Add post-creation unique constraints to the "chart_of_account" table
ALTER TABLE "public"."chart_of_account" ADD CONSTRAINT "chart_of_account_id_key" UNIQUE ("id");
-- Create "order" table
CREATE TABLE "public"."order" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "event_id" uuid NOT NULL,
  "buyer_email" text NOT NULL,
  "buyer_name" text NOT NULL,
  "buyer_phone" text NULL,
  "subtotal" bigint NOT NULL,
  "discount_amount" bigint NOT NULL DEFAULT 0,
  "platform_fee" bigint NOT NULL DEFAULT 0,
  "paystack_fee" bigint NOT NULL DEFAULT 0,
  "total" bigint NOT NULL,
  "discount_code_id" uuid NULL,
  "paystack_reference" text NULL,
  "status" "public"."order_status" NOT NULL DEFAULT 'PENDING',
  "completed_at" timestamp NULL,
  "expires_at" timestamp NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "order_discount_code_id_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_code" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "order_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "order_discountAmount_check" CHECK (discount_amount >= 0),
  CONSTRAINT "order_paystackFee_check" CHECK (paystack_fee >= 0),
  CONSTRAINT "order_platformFee_check" CHECK (platform_fee >= 0),
  CONSTRAINT "order_subtotal_check" CHECK (subtotal >= 0),
  CONSTRAINT "order_total_check" CHECK (total >= 0)
);
-- Create index "order_buyerEmail_idx" to table: "order"
CREATE INDEX "order_buyerEmail_idx" ON "public"."order" ("buyer_email");
-- Create index "order_eventId_idx" to table: "order"
CREATE INDEX "order_eventId_idx" ON "public"."order" ("event_id");
-- Create index "order_paystackReference_idx" to table: "order"
CREATE INDEX "order_paystackReference_idx" ON "public"."order" ("paystack_reference");
-- Create index "order_status_idx" to table: "order"
CREATE INDEX "order_status_idx" ON "public"."order" ("status");
-- Add post-creation unique constraints to the "order" table
ALTER TABLE "public"."order" ADD CONSTRAINT "order_id_key" UNIQUE ("id");
-- Create "payment" table
CREATE TABLE "public"."payment" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "order_id" uuid NOT NULL,
  "paystack_reference" text NOT NULL,
  "amount" bigint NOT NULL,
  "paystack_fee" bigint NULL,
  "status" "public"."payment_status" NOT NULL DEFAULT 'PENDING',
  "paid_at" timestamp NULL,
  "metadata" text NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "payment_paystack_reference_key" UNIQUE ("paystack_reference"),
  CONSTRAINT "payment_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "payment_amount_check" CHECK (amount > 0),
  CONSTRAINT "payment_paystackFee_check" CHECK ((paystack_fee IS NULL) OR (paystack_fee >= 0))
);
-- Create index "payment_orderId_idx" to table: "payment"
CREATE INDEX "payment_orderId_idx" ON "public"."payment" ("order_id");
-- Create index "payment_paystackReference_idx" to table: "payment"
CREATE UNIQUE INDEX "payment_paystackReference_idx" ON "public"."payment" ("paystack_reference");
-- Add post-creation unique constraints to the "payment" table
ALTER TABLE "public"."payment" ADD CONSTRAINT "payment_id_key" UNIQUE ("id");
-- Create "refund" table
CREATE TABLE "public"."refund" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "order_id" uuid NOT NULL,
  "payment_id" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "paystack_refund_reference" text NULL,
  "status" "public"."refund_status" NOT NULL DEFAULT 'PENDING',
  "reason" text NULL,
  "processed_at" timestamp NULL,
  "processed_by" uuid NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "refund_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "refund_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payment" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "refund_processed_by_user_id_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "refund_amount_check" CHECK (amount > 0)
);
-- Create index "refund_orderId_idx" to table: "refund"
CREATE INDEX "refund_orderId_idx" ON "public"."refund" ("order_id");
-- Create index "refund_paymentId_idx" to table: "refund"
CREATE INDEX "refund_paymentId_idx" ON "public"."refund" ("payment_id");
-- Add post-creation unique constraints to the "refund" table
ALTER TABLE "public"."refund" ADD CONSTRAINT "refund_id_key" UNIQUE ("id");
-- Create "transaction" table
CREATE TABLE "public"."transaction" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "description" text NOT NULL,
  "payment_id" uuid NULL,
  "refund_id" uuid NULL,
  "payout_id" uuid NULL,
  "metadata" text NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "transaction_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "public"."payment" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "transaction_refund_id_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "public"."refund" ("id") ON UPDATE NO ACTION ON DELETE SET NULL
);
-- Create index "transaction_paymentId_idx" to table: "transaction"
CREATE INDEX "transaction_paymentId_idx" ON "public"."transaction" ("payment_id");
-- Create index "transaction_payoutId_idx" to table: "transaction"
CREATE INDEX "transaction_payoutId_idx" ON "public"."transaction" ("payout_id");
-- Create index "transaction_refundId_idx" to table: "transaction"
CREATE INDEX "transaction_refundId_idx" ON "public"."transaction" ("refund_id");
-- Add post-creation unique constraints to the "transaction" table
ALTER TABLE "public"."transaction" ADD CONSTRAINT "transaction_id_key" UNIQUE ("id");
-- Create "ledger_entry" table
CREATE TABLE "public"."ledger_entry" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "transaction_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "entry_type" "public"."entry_type" NOT NULL,
  "amount" bigint NOT NULL,
  "organizer_id" uuid NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "ledger_entry_account_id_chart_of_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_account" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "ledger_entry_organizer_id_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizer" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "ledger_entry_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "ledgerEntry_amount_check" CHECK (amount > 0)
);
-- Create index "ledgerEntry_accountId_idx" to table: "ledger_entry"
CREATE INDEX "ledgerEntry_accountId_idx" ON "public"."ledger_entry" ("account_id");
-- Create index "ledgerEntry_organizerId_idx" to table: "ledger_entry"
CREATE INDEX "ledgerEntry_organizerId_idx" ON "public"."ledger_entry" ("organizer_id");
-- Create index "ledgerEntry_transactionId_idx" to table: "ledger_entry"
CREATE INDEX "ledgerEntry_transactionId_idx" ON "public"."ledger_entry" ("transaction_id");
-- Add post-creation unique constraints to the "ledger_entry" table
ALTER TABLE "public"."ledger_entry" ADD CONSTRAINT "ledger_entry_id_key" UNIQUE ("id");
-- Create "notification" table
CREATE TABLE "public"."notification" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "user_id" uuid NOT NULL,
  "type" "public"."notification_type" NOT NULL,
  "title" text NOT NULL,
  "body" text NULL,
  "event_id" uuid NULL,
  "order_id" uuid NULL,
  "is_read" boolean NOT NULL DEFAULT false,
  "read_at" timestamp NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "notification_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "notification_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "notification_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "notification_userId_idx" to table: "notification"
CREATE INDEX "notification_userId_idx" ON "public"."notification" ("user_id");
-- Create index "notification_userId_isRead_idx" to table: "notification"
CREATE INDEX "notification_userId_isRead_idx" ON "public"."notification" ("user_id", "is_read");
-- Add post-creation unique constraints to the "notification" table
ALTER TABLE "public"."notification" ADD CONSTRAINT "notification_id_key" UNIQUE ("id");
-- Create "ticket_type" table
CREATE TABLE "public"."ticket_type" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "event_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text NULL,
  "price" bigint NOT NULL,
  "quantity" integer NOT NULL,
  "sold_count" integer NOT NULL DEFAULT 0,
  "sales_start_date" timestamp NULL,
  "sales_end_date" timestamp NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "fee_bearer" "public"."fee_bearer" NOT NULL DEFAULT 'CUSTOMER',
  PRIMARY KEY ("id"),
  CONSTRAINT "ticket_type_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "ticketType_price_check" CHECK (price >= 0),
  CONSTRAINT "ticketType_quantity_check" CHECK (quantity > 0),
  CONSTRAINT "ticketType_soldCount_check" CHECK (sold_count >= 0),
  CONSTRAINT "ticketType_soldCount_quantity_check" CHECK (sold_count <= quantity)
);
-- Create index "ticketType_eventId_idx" to table: "ticket_type"
CREATE INDEX "ticketType_eventId_idx" ON "public"."ticket_type" ("event_id");
-- Add post-creation unique constraints to the "ticket_type" table
ALTER TABLE "public"."ticket_type" ADD CONSTRAINT "ticket_type_id_key" UNIQUE ("id");
-- Create "order_item" table
CREATE TABLE "public"."order_item" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "order_id" uuid NOT NULL,
  "ticket_type_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "unit_price" bigint NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "order_item_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."order" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "order_item_ticket_type_id_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "orderItem_quantity_check" CHECK (quantity > 0),
  CONSTRAINT "orderItem_unitPrice_check" CHECK (unit_price >= 0)
);
-- Create index "orderItem_orderId_idx" to table: "order_item"
CREATE INDEX "orderItem_orderId_idx" ON "public"."order_item" ("order_id");
-- Create index "orderItem_ticketTypeId_idx" to table: "order_item"
CREATE INDEX "orderItem_ticketTypeId_idx" ON "public"."order_item" ("ticket_type_id");
-- Add post-creation unique constraints to the "order_item" table
ALTER TABLE "public"."order_item" ADD CONSTRAINT "order_item_id_key" UNIQUE ("id");
-- Create "payout" table
CREATE TABLE "public"."payout" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "organizer_id" uuid NOT NULL,
  "amount" bigint NOT NULL,
  "paystack_transfer_reference" text NULL,
  "paystack_transfer_code" text NULL,
  "status" "public"."payout_status" NOT NULL DEFAULT 'PENDING',
  "transaction_id" uuid NULL,
  "processed_at" timestamp NULL,
  "failure_reason" text NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "payout_organizer_id_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."organizer" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "payout_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transaction" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "payout_amount_check" CHECK (amount > 0)
);
-- Create index "payout_organizerId_idx" to table: "payout"
CREATE INDEX "payout_organizerId_idx" ON "public"."payout" ("organizer_id");
-- Create index "payout_status_idx" to table: "payout"
CREATE INDEX "payout_status_idx" ON "public"."payout" ("status");
-- Add post-creation unique constraints to the "payout" table
ALTER TABLE "public"."payout" ADD CONSTRAINT "payout_id_key" UNIQUE ("id");
-- Create "reservation" table
CREATE TABLE "public"."reservation" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "group_id" uuid NOT NULL,
  "ticket_type_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "quantity" integer NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "reservation_ticket_type_id_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "reservation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "reservation_quantity_check" CHECK (quantity > 0)
);
-- Create index "reservation_expiresAt_idx" to table: "reservation"
CREATE INDEX "reservation_expiresAt_idx" ON "public"."reservation" ("expires_at");
-- Create index "reservation_groupId_idx" to table: "reservation"
CREATE INDEX "reservation_groupId_idx" ON "public"."reservation" ("group_id");
-- Create index "reservation_ticketTypeId_idx" to table: "reservation"
CREATE INDEX "reservation_ticketTypeId_idx" ON "public"."reservation" ("ticket_type_id");
-- Create index "reservation_userId_idx" to table: "reservation"
CREATE INDEX "reservation_userId_idx" ON "public"."reservation" ("user_id");
-- Add post-creation unique constraints to the "reservation" table
ALTER TABLE "public"."reservation" ADD CONSTRAINT "reservation_id_key" UNIQUE ("id");
-- Create "saved_event" table
CREATE TABLE "public"."saved_event" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "user_id" uuid NOT NULL,
  "event_id" uuid NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "saved_event_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."event" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "saved_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "savedEvent_userId_eventId_idx" to table: "saved_event"
CREATE UNIQUE INDEX "savedEvent_userId_eventId_idx" ON "public"."saved_event" ("user_id", "event_id");
-- Create index "savedEvent_userId_idx" to table: "saved_event"
CREATE INDEX "savedEvent_userId_idx" ON "public"."saved_event" ("user_id");
-- Add post-creation unique constraints to the "saved_event" table
ALTER TABLE "public"."saved_event" ADD CONSTRAINT "saved_event_id_key" UNIQUE ("id");
-- Create "session" table
CREATE TABLE "public"."session" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL,
  "ip_address" text NULL,
  "user_agent" text NULL,
  "user_id" uuid NOT NULL,
  PRIMARY KEY ("id"),
  CONSTRAINT "session_token_key" UNIQUE ("token"),
  CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "session_userId_idx" to table: "session"
CREATE INDEX "session_userId_idx" ON "public"."session" ("user_id");
-- Add post-creation unique constraints to the "session" table
ALTER TABLE "public"."session" ADD CONSTRAINT "session_id_key" UNIQUE ("id");
-- Create "ticket" table
CREATE TABLE "public"."ticket" (
  "id" uuid NOT NULL DEFAULT uuidv7(),
  "order_item_id" uuid NOT NULL,
  "ticket_type_id" uuid NOT NULL,
  "code" text NOT NULL,
  "attendee_email" text NULL,
  "attendee_name" text NULL,
  "status" "public"."ticket_status" NOT NULL DEFAULT 'VALID',
  "checked_in_at" timestamp NULL,
  "checked_in_by" uuid NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  CONSTRAINT "ticket_code_key" UNIQUE ("code"),
  CONSTRAINT "ticket_checked_in_by_user_id_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "public"."user" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "ticket_order_item_id_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_item" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "ticket_ticket_type_id_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "public"."ticket_type" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT
);
-- Create index "ticket_attendeeEmail_idx" to table: "ticket"
CREATE INDEX "ticket_attendeeEmail_idx" ON "public"."ticket" ("attendee_email");
-- Create index "ticket_code_idx" to table: "ticket"
CREATE UNIQUE INDEX "ticket_code_idx" ON "public"."ticket" ("code");
-- Create index "ticket_orderItemId_idx" to table: "ticket"
CREATE INDEX "ticket_orderItemId_idx" ON "public"."ticket" ("order_item_id");
-- Create index "ticket_status_idx" to table: "ticket"
CREATE INDEX "ticket_status_idx" ON "public"."ticket" ("status");
-- Create index "ticket_ticketTypeId_idx" to table: "ticket"
CREATE INDEX "ticket_ticketTypeId_idx" ON "public"."ticket" ("ticket_type_id");
-- Add post-creation unique constraints to the "ticket" table
ALTER TABLE "public"."ticket" ADD CONSTRAINT "ticket_id_key" UNIQUE ("id");
