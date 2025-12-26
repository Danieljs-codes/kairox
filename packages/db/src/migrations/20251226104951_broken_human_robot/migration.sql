CREATE TYPE "account_type" AS ENUM('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE');--> statement-breakpoint
CREATE TYPE "discount_type" AS ENUM('PERCENTAGE', 'FIXED');--> statement-breakpoint
CREATE TYPE "entry_type" AS ENUM('DEBIT', 'CREDIT');--> statement-breakpoint
CREATE TYPE "event_status" AS ENUM('DRAFT', 'PUBLISHED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "fee_bearer" AS ENUM('ORGANIZER', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "notification_type" AS ENUM('ORDER_CONFIRMED', 'TICKET_READY', 'EVENT_REMINDER', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'REFUND_PROCESSED', 'PAYOUT_SENT');--> statement-breakpoint
CREATE TYPE "order_status" AS ENUM('PENDING', 'COMPLETED', 'REFUNDED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "payment_status" AS ENUM('PENDING', 'SUCCESSFUL', 'FAILED');--> statement-breakpoint
CREATE TYPE "payout_status" AS ENUM('PENDING', 'PROCESSING', 'SUCCESSFUL', 'FAILED');--> statement-breakpoint
CREATE TYPE "refund_status" AS ENUM('PENDING', 'PROCESSED', 'FAILED');--> statement-breakpoint
CREATE TYPE "ticket_status" AS ENUM('VALID', 'CHECKED_IN', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chart_of_account" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"account_type" "account_type" NOT NULL,
	"description" text,
	"is_system_account" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discount_code" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"event_id" uuid NOT NULL,
	"code" text NOT NULL,
	"discount_type" "discount_type" NOT NULL,
	"discount_value" bigint NOT NULL,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"max_uses_per_user" integer,
	"min_order_amount" bigint,
	"valid_from" timestamp,
	"valid_until" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "discountCode_discountValue_check" CHECK ("discount_value" > 0),
	CONSTRAINT "discountCode_usedCount_check" CHECK ("used_count" >= 0),
	CONSTRAINT "discountCode_minOrderAmount_check" CHECK ("min_order_amount" IS NULL OR "min_order_amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"organizer_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"venue_address" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"timezone" text,
	"fee_bearer" "fee_bearer" DEFAULT 'CUSTOMER'::"fee_bearer" NOT NULL,
	"status" "event_status" DEFAULT 'DRAFT'::"event_status" NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_endDate_check" CHECK ("end_date" > "start_date")
);
--> statement-breakpoint
CREATE TABLE "event_banner" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"event_id" uuid NOT NULL,
	"url" text NOT NULL,
	"blurhash" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entry" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"transaction_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"entry_type" "entry_type" NOT NULL,
	"amount" bigint NOT NULL,
	"organizer_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ledgerEntry_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"event_id" uuid,
	"order_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"event_id" uuid NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_phone" text,
	"subtotal" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"platform_fee" bigint DEFAULT 0 NOT NULL,
	"paystack_fee" bigint DEFAULT 0 NOT NULL,
	"total" bigint NOT NULL,
	"discount_code_id" uuid,
	"paystack_reference" text,
	"status" "order_status" DEFAULT 'PENDING'::"order_status" NOT NULL,
	"completed_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "order_subtotal_check" CHECK ("subtotal" >= 0),
	CONSTRAINT "order_discountAmount_check" CHECK ("discount_amount" >= 0),
	CONSTRAINT "order_platformFee_check" CHECK ("platform_fee" >= 0),
	CONSTRAINT "order_paystackFee_check" CHECK ("paystack_fee" >= 0),
	CONSTRAINT "order_total_check" CHECK ("total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "order_item" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"order_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "orderItem_quantity_check" CHECK ("quantity" > 0),
	CONSTRAINT "orderItem_unitPrice_check" CHECK ("unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "organizer" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"bank_code" text,
	"account_number" text,
	"account_name" text,
	"paystack_recipient_code" text,
	"available_balance" bigint DEFAULT 0 NOT NULL,
	"pending_balance" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizer_availableBalance_check" CHECK ("available_balance" >= 0),
	CONSTRAINT "organizer_pendingBalance_check" CHECK ("pending_balance" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payment" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"order_id" uuid NOT NULL,
	"paystack_reference" text NOT NULL UNIQUE,
	"amount" bigint NOT NULL,
	"paystack_fee" bigint,
	"status" "payment_status" DEFAULT 'PENDING'::"payment_status" NOT NULL,
	"paid_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_amount_check" CHECK ("amount" > 0),
	CONSTRAINT "payment_paystackFee_check" CHECK ("paystack_fee" IS NULL OR "paystack_fee" >= 0)
);
--> statement-breakpoint
CREATE TABLE "payout" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"organizer_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"paystack_transfer_reference" text,
	"paystack_transfer_code" text,
	"status" "payout_status" DEFAULT 'PENDING'::"payout_status" NOT NULL,
	"transaction_id" uuid,
	"processed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "refund" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"order_id" uuid NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"paystack_refund_reference" text,
	"status" "refund_status" DEFAULT 'PENDING'::"refund_status" NOT NULL,
	"reason" text,
	"processed_at" timestamp,
	"processed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "refund_amount_check" CHECK ("amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"group_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reservation_quantity_check" CHECK ("quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "saved_event" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"user_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"order_item_id" uuid NOT NULL,
	"ticket_type_id" uuid NOT NULL,
	"code" text NOT NULL UNIQUE,
	"attendee_email" text,
	"attendee_name" text,
	"status" "ticket_status" DEFAULT 'VALID'::"ticket_status" NOT NULL,
	"checked_in_at" timestamp,
	"checked_in_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_type" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"sold_count" integer DEFAULT 0 NOT NULL,
	"sales_start_date" timestamp,
	"sales_end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticketType_price_check" CHECK ("price" >= 0),
	CONSTRAINT "ticketType_quantity_check" CHECK ("quantity" > 0),
	CONSTRAINT "ticketType_soldCount_check" CHECK ("sold_count" >= 0),
	CONSTRAINT "ticketType_soldCount_quantity_check" CHECK ("sold_count" <= "quantity")
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"description" text NOT NULL,
	"payment_id" uuid,
	"refund_id" uuid,
	"payout_id" uuid,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() UNIQUE,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chartOfAccount_code_idx" ON "chart_of_account" ("code");--> statement-breakpoint
CREATE INDEX "discountCode_eventId_idx" ON "discount_code" ("event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "discountCode_eventId_code_idx" ON "discount_code" ("event_id","code");--> statement-breakpoint
CREATE INDEX "event_organizerId_idx" ON "event" ("organizer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "event_organizerId_slug_idx" ON "event" ("organizer_id","slug");--> statement-breakpoint
CREATE INDEX "event_status_idx" ON "event" ("status");--> statement-breakpoint
CREATE INDEX "event_startDate_idx" ON "event" ("start_date");--> statement-breakpoint
CREATE INDEX "eventBanner_eventId_idx" ON "event_banner" ("event_id");--> statement-breakpoint
CREATE INDEX "ledgerEntry_transactionId_idx" ON "ledger_entry" ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledgerEntry_accountId_idx" ON "ledger_entry" ("account_id");--> statement-breakpoint
CREATE INDEX "ledgerEntry_organizerId_idx" ON "ledger_entry" ("organizer_id");--> statement-breakpoint
CREATE INDEX "notification_userId_idx" ON "notification" ("user_id");--> statement-breakpoint
CREATE INDEX "notification_userId_isRead_idx" ON "notification" ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "order_eventId_idx" ON "order" ("event_id");--> statement-breakpoint
CREATE INDEX "order_buyerEmail_idx" ON "order" ("buyer_email");--> statement-breakpoint
CREATE INDEX "order_status_idx" ON "order" ("status");--> statement-breakpoint
CREATE INDEX "order_paystackReference_idx" ON "order" ("paystack_reference");--> statement-breakpoint
CREATE INDEX "orderItem_orderId_idx" ON "order_item" ("order_id");--> statement-breakpoint
CREATE INDEX "orderItem_ticketTypeId_idx" ON "order_item" ("ticket_type_id");--> statement-breakpoint
CREATE INDEX "organizer_ownerId_idx" ON "organizer" ("owner_id");--> statement-breakpoint
CREATE INDEX "payment_orderId_idx" ON "payment" ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_paystackReference_idx" ON "payment" ("paystack_reference");--> statement-breakpoint
CREATE INDEX "payout_organizerId_idx" ON "payout" ("organizer_id");--> statement-breakpoint
CREATE INDEX "payout_status_idx" ON "payout" ("status");--> statement-breakpoint
CREATE INDEX "refund_orderId_idx" ON "refund" ("order_id");--> statement-breakpoint
CREATE INDEX "refund_paymentId_idx" ON "refund" ("payment_id");--> statement-breakpoint
CREATE INDEX "reservation_groupId_idx" ON "reservation" ("group_id");--> statement-breakpoint
CREATE INDEX "reservation_ticketTypeId_idx" ON "reservation" ("ticket_type_id");--> statement-breakpoint
CREATE INDEX "reservation_userId_idx" ON "reservation" ("user_id");--> statement-breakpoint
CREATE INDEX "reservation_expiresAt_idx" ON "reservation" ("expires_at");--> statement-breakpoint
CREATE INDEX "savedEvent_userId_idx" ON "saved_event" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "savedEvent_userId_eventId_idx" ON "saved_event" ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "ticket_orderItemId_idx" ON "ticket" ("order_item_id");--> statement-breakpoint
CREATE INDEX "ticket_ticketTypeId_idx" ON "ticket" ("ticket_type_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ticket_code_idx" ON "ticket" ("code");--> statement-breakpoint
CREATE INDEX "ticket_status_idx" ON "ticket" ("status");--> statement-breakpoint
CREATE INDEX "ticket_attendeeEmail_idx" ON "ticket" ("attendee_email");--> statement-breakpoint
CREATE INDEX "ticketType_eventId_idx" ON "ticket_type" ("event_id");--> statement-breakpoint
CREATE INDEX "transaction_paymentId_idx" ON "transaction" ("payment_id");--> statement-breakpoint
CREATE INDEX "transaction_refundId_idx" ON "transaction" ("refund_id");--> statement-breakpoint
CREATE INDEX "transaction_payoutId_idx" ON "transaction" ("payout_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "discount_code" ADD CONSTRAINT "discount_code_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organizer_id_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "event_banner" ADD CONSTRAINT "event_banner_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_account_id_chart_of_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "chart_of_account"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_organizer_id_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "order" ADD CONSTRAINT "order_discount_code_id_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_code"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_ticket_type_id_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_type"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "organizer" ADD CONSTRAINT "organizer_owner_id_user_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_organizer_id_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "organizer"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "payout" ADD CONSTRAINT "payout_transaction_id_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "transaction"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_order_id_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "order"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "refund" ADD CONSTRAINT "refund_processed_by_user_id_fkey" FOREIGN KEY ("processed_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_ticket_type_id_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_type"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_event" ADD CONSTRAINT "saved_event_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_event" ADD CONSTRAINT "saved_event_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_order_item_id_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_item"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_ticket_type_id_ticket_type_id_fkey" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_type"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "ticket" ADD CONSTRAINT "ticket_checked_in_by_user_id_fkey" FOREIGN KEY ("checked_in_by") REFERENCES "user"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "ticket_type" ADD CONSTRAINT "ticket_type_event_id_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "event"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_payment_id_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payment"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_refund_id_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refund"("id") ON DELETE SET NULL;