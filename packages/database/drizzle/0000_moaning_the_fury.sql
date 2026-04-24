DO $$ BEGIN
 CREATE TYPE "public"."api_key_status" AS ENUM('active', 'revoked', 'expired');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."contest_status" AS ENUM('draft', 'upcoming', 'active', 'evaluation', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."http_method" AS ENUM('GET', 'POST', 'PUT', 'PATCH', 'DELETE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."model_status" AS ENUM('draft', 'pending_review', 'published', 'deprecated', 'archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."model_type" AS ENUM('llm', 'image', 'audio', 'video', 'multimodal', 'embedding', 'code', 'speech-to-text', 'text-to-speech');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('system', 'payment', 'subscription', 'api_update', 'contest', 'message');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."org_role" AS ENUM('owner', 'admin', 'developer', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'authorized', 'confirmed', 'refunded', 'partial_refunded', 'cancelled', 'rejected', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."pricing_type" AS ENUM('free', 'freemium', 'pay_per_use', 'subscription', 'custom');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."request_status" AS ENUM('open', 'in_progress', 'completed', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."request_type" AS ENUM('api_development', 'integration', 'custom_model', 'consulting');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_status" AS ENUM('active', 'paused', 'cancelled', 'expired', 'trial');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('user', 'developer', 'admin', 'moderator');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"password_hash" text,
	"name" text,
	"username" varchar(50),
	"image" text,
	"bio" text,
	"website" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"location" text,
	"company" text,
	"social_links" jsonb,
	"preferences" jsonb DEFAULT '{"notifications":true,"newsletter":false,"theme":"system","language":"ru"}'::jsonb,
	"balance" text DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"consent_processing" boolean DEFAULT false NOT NULL,
	"consent_transborder" boolean DEFAULT false NOT NULL,
	"consent_marketing" boolean DEFAULT false NOT NULL,
	"consent_timestamp" timestamp,
	"consent_ip_address" varchar(45),
	"consent_user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"token" text NOT NULL,
	"invited_by_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organization_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "org_role" DEFAULT 'viewer' NOT NULL,
	"permissions" jsonb,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo" text,
	"banner" text,
	"website" text,
	"email" text,
	"support_email" text,
	"social_links" jsonb,
	"settings" jsonb DEFAULT '{"isPublic":true,"allowJoinRequests":true,"defaultApiVisibility":"public"}'::jsonb,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"owner_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"description" text,
	"type" "model_type" NOT NULL,
	"status" "model_status" DEFAULT 'draft' NOT NULL,
	"logo" text,
	"banner" text,
	"tags" text[],
	"base_url" text,
	"documentation_url" text,
	"terms_url" text,
	"privacy_url" text,
	"capabilities" jsonb,
	"specifications" jsonb,
	"pricing_type" "pricing_type" DEFAULT 'pay_per_use',
	"rate_limits" jsonb,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"total_subscribers" integer DEFAULT 0 NOT NULL,
	"avg_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"owner_id" uuid NOT NULL,
	"organization_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"method" "http_method" DEFAULT 'POST' NOT NULL,
	"path" text NOT NULL,
	"request_schema" jsonb,
	"response_schema" jsonb,
	"example_request" jsonb,
	"example_response" jsonb,
	"price_per_request" numeric(10, 6),
	"price_per_token" numeric(10, 8),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_deprecated" boolean DEFAULT false NOT NULL,
	"deprecation_message" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "pricing_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"price" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RUB' NOT NULL,
	"billing_period" varchar(20) DEFAULT 'monthly',
	"limits" jsonb,
	"features" text[],
	"trial_days" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_popular" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(12) NOT NULL,
	"last_chars" varchar(4) NOT NULL,
	"permissions" jsonb,
	"rate_limits" jsonb,
	"status" "api_key_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revoke_reason" text,
	"last_used_at" timestamp,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"api_key_id" uuid,
	"user_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"endpoint_id" uuid,
	"subscription_id" uuid,
	"method" varchar(10) NOT NULL,
	"path" text NOT NULL,
	"status_code" integer NOT NULL,
	"response_time_ms" integer,
	"tokens_used" integer,
	"cost" numeric(12, 6),
	"ip_address" varchar(45),
	"user_agent" text,
	"error_code" varchar(50),
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"plan_id" uuid,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp NOT NULL,
	"current_period_end" timestamp NOT NULL,
	"used_requests" integer DEFAULT 0 NOT NULL,
	"used_tokens" integer DEFAULT 0 NOT NULL,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"tinkoff_rebill_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "usage_stats_daily" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp NOT NULL,
	"model_id" uuid NOT NULL,
	"user_id" uuid,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"successful_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(12, 2) DEFAULT '0',
	"avg_response_time_ms" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "balance_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"payment_id" uuid,
	"type" varchar(20) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"balance_before" numeric(12, 2) NOT NULL,
	"balance_after" numeric(12, 2) NOT NULL,
	"description" text,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_webhook_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid,
	"event_type" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"signature_valid" text,
	"processed_at" timestamp,
	"processing_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RUB' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"tinkoff_payment_id" text,
	"tinkoff_order_id" text,
	"tinkoff_status" varchar(50),
	"tinkoff_rebill_id" text,
	"payment_method" varchar(50),
	"card_pan" varchar(20),
	"card_exp_date" varchar(5),
	"description" text,
	"receipt" jsonb,
	"metadata" jsonb,
	"error_code" varchar(50),
	"error_message" text,
	"refunded_amount" numeric(12, 2),
	"refunded_at" timestamp,
	"refund_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	CONSTRAINT "payments_tinkoff_payment_id_unique" UNIQUE("tinkoff_payment_id"),
	CONSTRAINT "payments_tinkoff_order_id_unique" UNIQUE("tinkoff_order_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'RUB' NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"bank_details_id" uuid,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"processed_at" timestamp,
	"transaction_id" text,
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contest_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid,
	"team_name" text,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"best_score" numeric(20, 10),
	"current_rank" integer,
	"is_approved" boolean DEFAULT true NOT NULL,
	"is_disqualified" boolean DEFAULT false NOT NULL,
	"disqualification_reason" text,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contest_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contest_id" uuid NOT NULL,
	"participant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_name" text,
	"file_size" integer,
	"description" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"score" numeric(20, 10),
	"public_score" numeric(20, 10),
	"private_score" numeric(20, 10),
	"metrics" jsonb,
	"error_message" text,
	"processing_time_ms" integer,
	"is_selected" boolean DEFAULT false NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"scored_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" text NOT NULL,
	"short_description" text,
	"description" text,
	"logo" text,
	"banner" text,
	"tags" text[],
	"status" "contest_status" DEFAULT 'draft' NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"evaluation_ends_at" timestamp,
	"config" jsonb,
	"total_prize_pool" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'RUB',
	"prizes" jsonb,
	"evaluation_metrics" jsonb,
	"rules" text,
	"data_description" text,
	"submission_format" text,
	"dataset_url" text,
	"sample_submission_url" text,
	"total_participants" integer DEFAULT 0 NOT NULL,
	"total_submissions" integer DEFAULT 0 NOT NULL,
	"owner_id" uuid NOT NULL,
	"organization_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "marketplace_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "request_type" DEFAULT 'api_development' NOT NULL,
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"budget_min" numeric(12, 2),
	"budget_max" numeric(12, 2),
	"currency" varchar(3) DEFAULT 'RUB',
	"requirements" jsonb,
	"tags" text[],
	"attachments" jsonb,
	"total_responses" integer DEFAULT 0 NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"deadline" timestamp,
	"owner_id" uuid NOT NULL,
	"organization_id" uuid,
	"is_public" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "request_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"proposal" text NOT NULL,
	"estimated_budget" numeric(12, 2),
	"estimated_timeline" text,
	"portfolio" jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" varchar(20) DEFAULT 'update' NOT NULL,
	"author_id" uuid NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text,
	"action_url" text,
	"action_label" text,
	"reference_type" varchar(50),
	"reference_id" uuid,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"is_archived" boolean DEFAULT false NOT NULL,
	"email_sent" boolean DEFAULT false NOT NULL,
	"email_sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "organizations" ADD CONSTRAINT "organizations_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_endpoints" ADD CONSTRAINT "model_endpoints_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_reviews" ADD CONSTRAINT "model_reviews_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_reviews" ADD CONSTRAINT "model_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "pricing_plans" ADD CONSTRAINT "pricing_plans_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_usage_logs" ADD CONSTRAINT "api_usage_logs_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_pricing_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."pricing_plans"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_stats_daily" ADD CONSTRAINT "usage_stats_daily_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "usage_stats_daily" ADD CONSTRAINT "usage_stats_daily_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_webhook_logs" ADD CONSTRAINT "payment_webhook_logs_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contest_participants" ADD CONSTRAINT "contest_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_participant_id_contest_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."contest_participants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contest_submissions" ADD CONSTRAINT "contest_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contests" ADD CONSTRAINT "contests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contests" ADD CONSTRAINT "contests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketplace_requests" ADD CONSTRAINT "marketplace_requests_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "marketplace_requests" ADD CONSTRAINT "marketplace_requests_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_responses" ADD CONSTRAINT "request_responses_request_id_marketplace_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."marketplace_requests"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "request_responses" ADD CONSTRAINT "request_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "model_announcements" ADD CONSTRAINT "model_announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_user_id_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "accounts_provider_idx" ON "accounts" ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_user_id_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sessions_token_idx" ON "sessions" ("session_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_username_idx" ON "users" ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users" ("role");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_tokens_identifier_idx" ON "verification_tokens" ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_invites_token_idx" ON "organization_invites" ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_invites_org_idx" ON "organization_invites" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_invites_email_idx" ON "organization_invites" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "org_members_org_user_idx" ON "organization_members" ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_members_user_idx" ON "organization_members" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "org_members_org_idx" ON "organization_members" ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_owner_idx" ON "organizations" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_name_idx" ON "organizations" ("name");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ai_models_slug_owner_idx" ON "ai_models" ("slug","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_type_idx" ON "ai_models" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_status_idx" ON "ai_models" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_owner_idx" ON "ai_models" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_org_idx" ON "ai_models" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_public_idx" ON "ai_models" ("is_public","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_models_featured_idx" ON "ai_models" ("is_featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_endpoints_model_idx" ON "model_endpoints" ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "model_endpoints_slug_model_idx" ON "model_endpoints" ("slug","model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_reviews_model_idx" ON "model_reviews" ("model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "model_reviews_user_idx" ON "model_reviews" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "model_reviews_user_model_idx" ON "model_reviews" ("user_id","model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pricing_plans_model_idx" ON "pricing_plans" ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pricing_plans_slug_model_idx" ON "pricing_plans" ("slug","model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_user_idx" ON "api_keys" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("key_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_prefix_idx" ON "api_keys" ("key_prefix");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_status_idx" ON "api_keys" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_user_idx" ON "api_usage_logs" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_model_idx" ON "api_usage_logs" ("model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_key_idx" ON "api_usage_logs" ("api_key_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_created_at_idx" ON "api_usage_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_analytics_idx" ON "api_usage_logs" ("model_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_user_idx" ON "subscriptions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_model_idx" ON "subscriptions" ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "subscriptions_user_model_idx" ON "subscriptions" ("user_id","model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_status_idx" ON "subscriptions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "subscriptions_period_end_idx" ON "subscriptions" ("current_period_end");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "usage_stats_date_model_idx" ON "usage_stats_daily" ("date","model_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_stats_model_idx" ON "usage_stats_daily" ("model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "usage_stats_user_idx" ON "usage_stats_daily" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "balance_tx_user_idx" ON "balance_transactions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "balance_tx_payment_idx" ON "balance_transactions" ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "balance_tx_type_idx" ON "balance_transactions" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "balance_tx_created_at_idx" ON "balance_transactions" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_logs_payment_idx" ON "payment_webhook_logs" ("payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_logs_event_type_idx" ON "payment_webhook_logs" ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_logs_created_at_idx" ON "payment_webhook_logs" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_user_idx" ON "payments" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_subscription_idx" ON "payments" ("subscription_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_tinkoff_payment_idx" ON "payments" ("tinkoff_payment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_tinkoff_order_idx" ON "payments" ("tinkoff_order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payments_created_at_idx" ON "payments" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_user_idx" ON "payouts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_status_idx" ON "payouts" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payouts_period_idx" ON "payouts" ("period_start","period_end");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contest_participants_contest_user_idx" ON "contest_participants" ("contest_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_participants_contest_idx" ON "contest_participants" ("contest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_participants_user_idx" ON "contest_participants" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_participants_rank_idx" ON "contest_participants" ("contest_id","current_rank");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_submissions_contest_idx" ON "contest_submissions" ("contest_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_submissions_participant_idx" ON "contest_submissions" ("participant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_submissions_user_idx" ON "contest_submissions" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_submissions_status_idx" ON "contest_submissions" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_submissions_score_idx" ON "contest_submissions" ("contest_id","public_score");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contest_submissions_created_at_idx" ON "contest_submissions" ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "contests_slug_owner_idx" ON "contests" ("slug","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contests_status_idx" ON "contests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contests_owner_idx" ON "contests" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contests_org_idx" ON "contests" ("organization_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contests_dates_idx" ON "contests" ("starts_at","ends_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "contests_public_idx" ON "contests" ("is_public","status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "requests_slug_owner_idx" ON "marketplace_requests" ("slug","owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_type_idx" ON "marketplace_requests" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_status_idx" ON "marketplace_requests" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_owner_idx" ON "marketplace_requests" ("owner_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_public_idx" ON "marketplace_requests" ("is_public","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "requests_deadline_idx" ON "marketplace_requests" ("deadline");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "responses_request_user_idx" ON "request_responses" ("request_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_request_idx" ON "request_responses" ("request_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_user_idx" ON "request_responses" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "responses_status_idx" ON "request_responses" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_model_idx" ON "model_announcements" ("model_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_author_idx" ON "model_announcements" ("author_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "announcements_published_idx" ON "model_announcements" ("is_published","published_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_user_unread_idx" ON "notifications" ("user_id","is_read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications" ("created_at");