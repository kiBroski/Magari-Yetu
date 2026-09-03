import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('buyer', 'individual_seller', 'dealer', 'moderator', 'admin');
  CREATE TYPE "public"."enum_users_requested_role" AS ENUM('buyer', 'individual_seller', 'dealer');
  CREATE TYPE "public"."enum_dealers_deals_in" AS ENUM('new', 'import', 'locally-used', 'heavy-machinery');
  CREATE TYPE "public"."enum_dealers_county" AS ENUM('Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Kisumu', 'Machakos', 'Other');
  CREATE TYPE "public"."enum_dealers_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');
  CREATE TYPE "public"."enum_dealers_subscription_tier" AS ENUM('free', 'pro', 'premium');
  CREATE TYPE "public"."enum_service_providers_services" AS ENUM('certified-mechanic', 'auto-electrical', 'body-painting', 'tinting', 'detailing', 'identity-marking', 'inspection', 'spare-parts', 'car-hire', 'leasing', 'towing');
  CREATE TYPE "public"."enum_service_providers_verification_status" AS ENUM('unverified', 'pending', 'verified', 'rejected');
  CREATE TYPE "public"."enum_listings_category" AS ENUM('car', 'motorcycle', 'tractor', 'heavy-machinery', 'pickup-van', 'truck', 'bus', 'trailer', 'tuk-tuk', 'spare-parts');
  CREATE TYPE "public"."enum_listings_condition" AS ENUM('brand-new', 'locally-assembled', 'foreign-used', 'locally-used');
  CREATE TYPE "public"."enum_listings_transmission" AS ENUM('manual', 'automatic', 'cvt');
  CREATE TYPE "public"."enum_listings_fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'electric');
  CREATE TYPE "public"."enum_listings_body_type" AS ENUM('sedan', 'suv', 'hatchback', 'wagon', 'pickup', 'van', 'coupe', 'convertible');
  CREATE TYPE "public"."enum_listings_heavy_machine_specs_equipment_type" AS ENUM('excavator', 'bulldozer', 'wheel-loader', 'grader', 'backhoe-loader', 'tractor', 'crane', 'forklift', 'compactor-/-roller', 'combine-harvester', 'cane-loader', 'generator', 'other');
  CREATE TYPE "public"."enum_listings_spare_part_details_part_condition" AS ENUM('new', 'refurbished', 'used');
  CREATE TYPE "public"."enum_listings_duty_status" AS ENUM('duty-paid', 'bonded-pre-clearance');
  CREATE TYPE "public"."enum_listings_currency" AS ENUM('KES');
  CREATE TYPE "public"."enum_listings_county" AS ENUM('Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Uasin Gishu', 'Kisumu', 'Machakos', 'Kajiado', 'Kilifi', 'Meru', 'Nyeri', 'Other');
  CREATE TYPE "public"."enum_listings_status" AS ENUM('draft', 'pending-review', 'active', 'sold', 'expired', 'rejected');
  CREATE TYPE "public"."enum_listings_moderation_flag" AS ENUM('none', 'price-outlier-low', 'duplicate-vin');
  CREATE TYPE "public"."enum_reviews_target_type" AS ENUM('dealer', 'service-provider', 'seller');
  CREATE TYPE "public"."enum_reviews_status" AS ENUM('pending', 'published', 'rejected');
  CREATE TYPE "public"."enum_reports_target_type" AS ENUM('listing', 'user', 'dealer', 'service-provider');
  CREATE TYPE "public"."enum_reports_reason" AS ENUM('suspected-fraud', 'advance-fee-scam', 'misleading-listing', 'impersonation', 'abuse', 'other');
  CREATE TYPE "public"."enum_reports_status" AS ENUM('open', 'under-review', 'resolved', 'dismissed');
  CREATE TYPE "public"."enum_contact_messages_status" AS ENUM('new', 'in-progress', 'resolved');
  CREATE TYPE "public"."enum_whatsapp_submissions_status" AS ENUM('received', 'claimed', 'converted', 'rejected');
  CREATE TYPE "public"."enum_featured_orders_plan" AS ENUM('boost-3d', 'boost-7d', 'boost-30d', 'homepage-spotlight-7d');
  CREATE TYPE "public"."enum_featured_orders_payment_provider" AS ENUM('mpesa', 'card');
  CREATE TYPE "public"."enum_featured_orders_status" AS ENUM('pending', 'paid', 'failed', 'expired');
  CREATE TYPE "public"."enum_inquiries_channel" AS ENUM('whatsapp', 'phone', 'form');
  CREATE TYPE "public"."enum_inspections_checklist_result" AS ENUM('pass', 'fail', 'not-applicable');
  CREATE TYPE "public"."enum_inspections_status" AS ENUM('requested', 'scheduled', 'completed', 'failed');
  CREATE TYPE "public"."enum_inspections_overall_result" AS ENUM('pass', 'pass-with-notes', 'fail');
  CREATE TYPE "public"."enum_crsp_schedule_fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'electric');
  CREATE TYPE "public"."enum_crsp_schedule_category" AS ENUM('car', 'motorcycle', 'tractor', 'heavy-machinery', 'pickup-van', 'truck', 'bus', 'trailer', 'tuk-tuk', 'spare-parts');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"public_slug" varchar,
  	"bio" varchar,
  	"website" varchar,
  	"county" varchar,
  	"town" varchar,
  	"phone" varchar NOT NULL,
  	"whatsapp_opt_in" boolean DEFAULT true,
  	"role" "enum_users_role" DEFAULT 'buyer' NOT NULL,
  	"requested_role" "enum_users_requested_role",
  	"avatar_id" integer,
  	"id_verified" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"_verified" boolean,
  	"_verificationtoken" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"listings_id" integer
  );
  
  CREATE TABLE "dealers_deals_in" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_dealers_deals_in",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "dealers_verification_docs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"file_id" integer NOT NULL
  );
  
  CREATE TABLE "dealers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"business_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"cover_image_id" integer,
  	"description" varchar,
  	"county" "enum_dealers_county" NOT NULL,
  	"town" varchar,
  	"physical_address" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"contact_phone" varchar NOT NULL,
  	"whatsapp_number" varchar,
  	"verification_status" "enum_dealers_verification_status" DEFAULT 'unverified',
  	"subscription_tier" "enum_dealers_subscription_tier" DEFAULT 'free',
  	"subscription_renews_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_providers_services" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_service_providers_services",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "service_providers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"owner_id" integer NOT NULL,
  	"business_name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"description" varchar NOT NULL,
  	"makes_serviced" varchar,
  	"website" varchar,
  	"contact_phone" varchar NOT NULL,
  	"whatsapp_number" varchar,
  	"county" varchar NOT NULL,
  	"town" varchar,
  	"physical_address" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"verification_status" "enum_service_providers_verification_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "listings_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer NOT NULL
  );
  
  CREATE TABLE "listings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"seller_id" integer NOT NULL,
  	"dealer_id" integer,
  	"category" "enum_listings_category" NOT NULL,
  	"condition" "enum_listings_condition" NOT NULL,
  	"make" varchar NOT NULL,
  	"model" varchar NOT NULL,
  	"trim" varchar,
  	"year_of_manufacture" numeric NOT NULL,
  	"transmission" "enum_listings_transmission",
  	"fuel_type" "enum_listings_fuel_type",
  	"engine_cc" numeric,
  	"mileage_km" numeric,
  	"body_type" "enum_listings_body_type",
  	"color" varchar,
  	"heavy_machine_specs_equipment_type" "enum_listings_heavy_machine_specs_equipment_type",
  	"heavy_machine_specs_power_rating_hp" numeric,
  	"heavy_machine_specs_operating_hours" numeric,
  	"heavy_machine_specs_capacity_or_tonnage" varchar,
  	"heavy_machine_specs_attachments" varchar,
  	"spare_part_details_part_type" varchar,
  	"spare_part_details_compatible_models" varchar,
  	"spare_part_details_part_condition" "enum_listings_spare_part_details_part_condition",
  	"duty_status" "enum_listings_duty_status",
  	"vin_or_chassis" varchar,
  	"price" numeric NOT NULL,
  	"negotiable" boolean DEFAULT true,
  	"currency" "enum_listings_currency" DEFAULT 'KES',
  	"description" varchar NOT NULL,
  	"video_url" varchar,
  	"county" "enum_listings_county" NOT NULL,
  	"town" varchar,
  	"latitude" numeric,
  	"longitude" numeric,
  	"status" "enum_listings_status" DEFAULT 'pending-review',
  	"moderation_flag" "enum_listings_moderation_flag" DEFAULT 'none',
  	"featured" boolean DEFAULT false,
  	"featured_until" timestamp(3) with time zone,
  	"views" numeric DEFAULT 0,
  	"inquiry_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author_id" integer NOT NULL,
  	"target_type" "enum_reviews_target_type" NOT NULL,
  	"target_id" varchar NOT NULL,
  	"rating" numeric NOT NULL,
  	"title" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"status" "enum_reviews_status" DEFAULT 'pending',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "reports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"reporter_id" integer,
  	"target_type" "enum_reports_target_type" NOT NULL,
  	"target_id" varchar NOT NULL,
  	"reason" "enum_reports_reason" NOT NULL,
  	"details" varchar,
  	"status" "enum_reports_status" DEFAULT 'open',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "contact_messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"sender_id" integer,
  	"name" varchar NOT NULL,
  	"email" varchar,
  	"phone" varchar,
  	"subject" varchar NOT NULL,
  	"message" varchar NOT NULL,
  	"status" "enum_contact_messages_status" DEFAULT 'new',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "conversations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"listing_id" integer,
  	"last_message_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "conversations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "messages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"conversation_id" integer NOT NULL,
  	"sender_id" integer NOT NULL,
  	"body" varchar NOT NULL,
  	"read_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "whatsapp_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_phone" varchar NOT NULL,
  	"raw_text" varchar,
  	"parsed" jsonb,
  	"claimed_by_id" integer,
  	"status" "enum_whatsapp_submissions_status" DEFAULT 'received',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "featured_orders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"listing_id" integer NOT NULL,
  	"user_id" integer NOT NULL,
  	"plan" "enum_featured_orders_plan" NOT NULL,
  	"amount" numeric NOT NULL,
  	"duration_days" numeric NOT NULL,
  	"payment_provider" "enum_featured_orders_payment_provider" DEFAULT 'mpesa',
  	"provider_checkout_id" varchar,
  	"status" "enum_featured_orders_status" DEFAULT 'pending',
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "inquiries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"listing_id" integer NOT NULL,
  	"buyer_user_id" integer,
  	"buyer_name" varchar,
  	"buyer_phone" varchar,
  	"buyer_email" varchar,
  	"message" varchar,
  	"channel" "enum_inquiries_channel" NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"uploaded_by_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_full_url" varchar,
  	"sizes_full_width" numeric,
  	"sizes_full_height" numeric,
  	"sizes_full_mime_type" varchar,
  	"sizes_full_filesize" numeric,
  	"sizes_full_filename" varchar
  );
  
  CREATE TABLE "inspections_checklist" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"item" varchar NOT NULL,
  	"result" "enum_inspections_checklist_result",
  	"note" varchar
  );
  
  CREATE TABLE "inspections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"listing_id" integer NOT NULL,
  	"requested_by_id" integer,
  	"status" "enum_inspections_status" DEFAULT 'requested',
  	"inspector_id" integer,
  	"inspection_date" timestamp(3) with time zone,
  	"overall_result" "enum_inspections_overall_result",
  	"report_file_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "phone_otps" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"phone" varchar NOT NULL,
  	"code_hash" varchar NOT NULL,
  	"expires_at" timestamp(3) with time zone NOT NULL,
  	"attempts" numeric DEFAULT 0,
  	"consumed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "crsp_schedule" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"make" varchar NOT NULL,
  	"model" varchar NOT NULL,
  	"variant" varchar,
  	"engine_cc" numeric,
  	"fuel_type" "enum_crsp_schedule_fuel_type",
  	"category" "enum_crsp_schedule_category" NOT NULL,
  	"crsp_value_kes" numeric NOT NULL,
  	"verified" boolean DEFAULT false,
  	"source_note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"dealers_id" integer,
  	"service_providers_id" integer,
  	"listings_id" integer,
  	"reviews_id" integer,
  	"reports_id" integer,
  	"contact_messages_id" integer,
  	"conversations_id" integer,
  	"messages_id" integer,
  	"whatsapp_submissions_id" integer,
  	"featured_orders_id" integer,
  	"inquiries_id" integer,
  	"media_id" integer,
  	"inspections_id" integer,
  	"phone_otps_id" integer,
  	"crsp_schedule_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_listings_fk" FOREIGN KEY ("listings_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dealers_deals_in" ADD CONSTRAINT "dealers_deals_in_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dealers_verification_docs" ADD CONSTRAINT "dealers_verification_docs_file_id_media_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dealers_verification_docs" ADD CONSTRAINT "dealers_verification_docs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "dealers" ADD CONSTRAINT "dealers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dealers" ADD CONSTRAINT "dealers_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "dealers" ADD CONSTRAINT "dealers_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_providers_services" ADD CONSTRAINT "service_providers_services_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."service_providers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_providers" ADD CONSTRAINT "service_providers_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings_images" ADD CONSTRAINT "listings_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings_images" ADD CONSTRAINT "listings_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "listings" ADD CONSTRAINT "listings_dealer_id_dealers_id_fk" FOREIGN KEY ("dealer_id") REFERENCES "public"."dealers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "conversations" ADD CONSTRAINT "conversations_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "conversations_rels" ADD CONSTRAINT "conversations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "conversations_rels" ADD CONSTRAINT "conversations_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "whatsapp_submissions" ADD CONSTRAINT "whatsapp_submissions_claimed_by_id_users_id_fk" FOREIGN KEY ("claimed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "featured_orders" ADD CONSTRAINT "featured_orders_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "featured_orders" ADD CONSTRAINT "featured_orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_buyer_user_id_users_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inspections_checklist" ADD CONSTRAINT "inspections_checklist_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "inspections" ADD CONSTRAINT "inspections_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inspections" ADD CONSTRAINT "inspections_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inspections" ADD CONSTRAINT "inspections_inspector_id_users_id_fk" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "inspections" ADD CONSTRAINT "inspections_report_file_id_media_id_fk" FOREIGN KEY ("report_file_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dealers_fk" FOREIGN KEY ("dealers_id") REFERENCES "public"."dealers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_service_providers_fk" FOREIGN KEY ("service_providers_id") REFERENCES "public"."service_providers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_listings_fk" FOREIGN KEY ("listings_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reviews_fk" FOREIGN KEY ("reviews_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_reports_fk" FOREIGN KEY ("reports_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_contact_messages_fk" FOREIGN KEY ("contact_messages_id") REFERENCES "public"."contact_messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_conversations_fk" FOREIGN KEY ("conversations_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_messages_fk" FOREIGN KEY ("messages_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_whatsapp_submissions_fk" FOREIGN KEY ("whatsapp_submissions_id") REFERENCES "public"."whatsapp_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_featured_orders_fk" FOREIGN KEY ("featured_orders_id") REFERENCES "public"."featured_orders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inquiries_fk" FOREIGN KEY ("inquiries_id") REFERENCES "public"."inquiries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_inspections_fk" FOREIGN KEY ("inspections_id") REFERENCES "public"."inspections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_phone_otps_fk" FOREIGN KEY ("phone_otps_id") REFERENCES "public"."phone_otps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_crsp_schedule_fk" FOREIGN KEY ("crsp_schedule_id") REFERENCES "public"."crsp_schedule"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "users_public_slug_idx" ON "users" USING btree ("public_slug");
  CREATE UNIQUE INDEX "users_phone_idx" ON "users" USING btree ("phone");
  CREATE INDEX "users_avatar_idx" ON "users" USING btree ("avatar_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_listings_id_idx" ON "users_rels" USING btree ("listings_id");
  CREATE INDEX "dealers_deals_in_order_idx" ON "dealers_deals_in" USING btree ("order");
  CREATE INDEX "dealers_deals_in_parent_idx" ON "dealers_deals_in" USING btree ("parent_id");
  CREATE INDEX "dealers_verification_docs_order_idx" ON "dealers_verification_docs" USING btree ("_order");
  CREATE INDEX "dealers_verification_docs_parent_id_idx" ON "dealers_verification_docs" USING btree ("_parent_id");
  CREATE INDEX "dealers_verification_docs_file_idx" ON "dealers_verification_docs" USING btree ("file_id");
  CREATE INDEX "dealers_owner_idx" ON "dealers" USING btree ("owner_id");
  CREATE UNIQUE INDEX "dealers_slug_idx" ON "dealers" USING btree ("slug");
  CREATE INDEX "dealers_logo_idx" ON "dealers" USING btree ("logo_id");
  CREATE INDEX "dealers_cover_image_idx" ON "dealers" USING btree ("cover_image_id");
  CREATE INDEX "dealers_updated_at_idx" ON "dealers" USING btree ("updated_at");
  CREATE INDEX "dealers_created_at_idx" ON "dealers" USING btree ("created_at");
  CREATE INDEX "service_providers_services_order_idx" ON "service_providers_services" USING btree ("order");
  CREATE INDEX "service_providers_services_parent_idx" ON "service_providers_services" USING btree ("parent_id");
  CREATE INDEX "service_providers_owner_idx" ON "service_providers" USING btree ("owner_id");
  CREATE UNIQUE INDEX "service_providers_slug_idx" ON "service_providers" USING btree ("slug");
  CREATE INDEX "service_providers_logo_idx" ON "service_providers" USING btree ("logo_id");
  CREATE INDEX "service_providers_updated_at_idx" ON "service_providers" USING btree ("updated_at");
  CREATE INDEX "service_providers_created_at_idx" ON "service_providers" USING btree ("created_at");
  CREATE INDEX "listings_images_order_idx" ON "listings_images" USING btree ("_order");
  CREATE INDEX "listings_images_parent_id_idx" ON "listings_images" USING btree ("_parent_id");
  CREATE INDEX "listings_images_image_idx" ON "listings_images" USING btree ("image_id");
  CREATE UNIQUE INDEX "listings_slug_idx" ON "listings" USING btree ("slug");
  CREATE INDEX "listings_seller_idx" ON "listings" USING btree ("seller_id");
  CREATE INDEX "listings_dealer_idx" ON "listings" USING btree ("dealer_id");
  CREATE INDEX "listings_category_idx" ON "listings" USING btree ("category");
  CREATE INDEX "listings_condition_idx" ON "listings" USING btree ("condition");
  CREATE INDEX "listings_make_idx" ON "listings" USING btree ("make");
  CREATE INDEX "listings_model_idx" ON "listings" USING btree ("model");
  CREATE INDEX "listings_year_of_manufacture_idx" ON "listings" USING btree ("year_of_manufacture");
  CREATE INDEX "listings_mileage_km_idx" ON "listings" USING btree ("mileage_km");
  CREATE INDEX "listings_price_idx" ON "listings" USING btree ("price");
  CREATE INDEX "listings_status_idx" ON "listings" USING btree ("status");
  CREATE INDEX "listings_featured_idx" ON "listings" USING btree ("featured");
  CREATE INDEX "listings_updated_at_idx" ON "listings" USING btree ("updated_at");
  CREATE INDEX "listings_created_at_idx" ON "listings" USING btree ("created_at");
  CREATE INDEX "reviews_author_idx" ON "reviews" USING btree ("author_id");
  CREATE INDEX "reviews_updated_at_idx" ON "reviews" USING btree ("updated_at");
  CREATE INDEX "reviews_created_at_idx" ON "reviews" USING btree ("created_at");
  CREATE INDEX "reports_reporter_idx" ON "reports" USING btree ("reporter_id");
  CREATE INDEX "reports_updated_at_idx" ON "reports" USING btree ("updated_at");
  CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");
  CREATE INDEX "contact_messages_sender_idx" ON "contact_messages" USING btree ("sender_id");
  CREATE INDEX "contact_messages_updated_at_idx" ON "contact_messages" USING btree ("updated_at");
  CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages" USING btree ("created_at");
  CREATE INDEX "conversations_listing_idx" ON "conversations" USING btree ("listing_id");
  CREATE INDEX "conversations_updated_at_idx" ON "conversations" USING btree ("updated_at");
  CREATE INDEX "conversations_created_at_idx" ON "conversations" USING btree ("created_at");
  CREATE INDEX "conversations_rels_order_idx" ON "conversations_rels" USING btree ("order");
  CREATE INDEX "conversations_rels_parent_idx" ON "conversations_rels" USING btree ("parent_id");
  CREATE INDEX "conversations_rels_path_idx" ON "conversations_rels" USING btree ("path");
  CREATE INDEX "conversations_rels_users_id_idx" ON "conversations_rels" USING btree ("users_id");
  CREATE INDEX "messages_conversation_idx" ON "messages" USING btree ("conversation_id");
  CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");
  CREATE INDEX "messages_updated_at_idx" ON "messages" USING btree ("updated_at");
  CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");
  CREATE INDEX "whatsapp_submissions_claimed_by_idx" ON "whatsapp_submissions" USING btree ("claimed_by_id");
  CREATE INDEX "whatsapp_submissions_updated_at_idx" ON "whatsapp_submissions" USING btree ("updated_at");
  CREATE INDEX "whatsapp_submissions_created_at_idx" ON "whatsapp_submissions" USING btree ("created_at");
  CREATE INDEX "featured_orders_listing_idx" ON "featured_orders" USING btree ("listing_id");
  CREATE INDEX "featured_orders_user_idx" ON "featured_orders" USING btree ("user_id");
  CREATE INDEX "featured_orders_provider_checkout_id_idx" ON "featured_orders" USING btree ("provider_checkout_id");
  CREATE INDEX "featured_orders_status_idx" ON "featured_orders" USING btree ("status");
  CREATE INDEX "featured_orders_updated_at_idx" ON "featured_orders" USING btree ("updated_at");
  CREATE INDEX "featured_orders_created_at_idx" ON "featured_orders" USING btree ("created_at");
  CREATE INDEX "inquiries_listing_idx" ON "inquiries" USING btree ("listing_id");
  CREATE INDEX "inquiries_buyer_user_idx" ON "inquiries" USING btree ("buyer_user_id");
  CREATE INDEX "inquiries_updated_at_idx" ON "inquiries" USING btree ("updated_at");
  CREATE INDEX "inquiries_created_at_idx" ON "inquiries" USING btree ("created_at");
  CREATE INDEX "media_uploaded_by_idx" ON "media" USING btree ("uploaded_by_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_full_sizes_full_filename_idx" ON "media" USING btree ("sizes_full_filename");
  CREATE INDEX "inspections_checklist_order_idx" ON "inspections_checklist" USING btree ("_order");
  CREATE INDEX "inspections_checklist_parent_id_idx" ON "inspections_checklist" USING btree ("_parent_id");
  CREATE INDEX "inspections_listing_idx" ON "inspections" USING btree ("listing_id");
  CREATE INDEX "inspections_requested_by_idx" ON "inspections" USING btree ("requested_by_id");
  CREATE INDEX "inspections_inspector_idx" ON "inspections" USING btree ("inspector_id");
  CREATE INDEX "inspections_report_file_idx" ON "inspections" USING btree ("report_file_id");
  CREATE INDEX "inspections_updated_at_idx" ON "inspections" USING btree ("updated_at");
  CREATE INDEX "inspections_created_at_idx" ON "inspections" USING btree ("created_at");
  CREATE INDEX "phone_otps_phone_idx" ON "phone_otps" USING btree ("phone");
  CREATE INDEX "phone_otps_updated_at_idx" ON "phone_otps" USING btree ("updated_at");
  CREATE INDEX "phone_otps_created_at_idx" ON "phone_otps" USING btree ("created_at");
  CREATE INDEX "crsp_schedule_make_idx" ON "crsp_schedule" USING btree ("make");
  CREATE INDEX "crsp_schedule_model_idx" ON "crsp_schedule" USING btree ("model");
  CREATE INDEX "crsp_schedule_updated_at_idx" ON "crsp_schedule" USING btree ("updated_at");
  CREATE INDEX "crsp_schedule_created_at_idx" ON "crsp_schedule" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_dealers_id_idx" ON "payload_locked_documents_rels" USING btree ("dealers_id");
  CREATE INDEX "payload_locked_documents_rels_service_providers_id_idx" ON "payload_locked_documents_rels" USING btree ("service_providers_id");
  CREATE INDEX "payload_locked_documents_rels_listings_id_idx" ON "payload_locked_documents_rels" USING btree ("listings_id");
  CREATE INDEX "payload_locked_documents_rels_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("reviews_id");
  CREATE INDEX "payload_locked_documents_rels_reports_id_idx" ON "payload_locked_documents_rels" USING btree ("reports_id");
  CREATE INDEX "payload_locked_documents_rels_contact_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("contact_messages_id");
  CREATE INDEX "payload_locked_documents_rels_conversations_id_idx" ON "payload_locked_documents_rels" USING btree ("conversations_id");
  CREATE INDEX "payload_locked_documents_rels_messages_id_idx" ON "payload_locked_documents_rels" USING btree ("messages_id");
  CREATE INDEX "payload_locked_documents_rels_whatsapp_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("whatsapp_submissions_id");
  CREATE INDEX "payload_locked_documents_rels_featured_orders_id_idx" ON "payload_locked_documents_rels" USING btree ("featured_orders_id");
  CREATE INDEX "payload_locked_documents_rels_inquiries_id_idx" ON "payload_locked_documents_rels" USING btree ("inquiries_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_inspections_id_idx" ON "payload_locked_documents_rels" USING btree ("inspections_id");
  CREATE INDEX "payload_locked_documents_rels_phone_otps_id_idx" ON "payload_locked_documents_rels" USING btree ("phone_otps_id");
  CREATE INDEX "payload_locked_documents_rels_crsp_schedule_id_idx" ON "payload_locked_documents_rels" USING btree ("crsp_schedule_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "dealers_deals_in" CASCADE;
  DROP TABLE "dealers_verification_docs" CASCADE;
  DROP TABLE "dealers" CASCADE;
  DROP TABLE "service_providers_services" CASCADE;
  DROP TABLE "service_providers" CASCADE;
  DROP TABLE "listings_images" CASCADE;
  DROP TABLE "listings" CASCADE;
  DROP TABLE "reviews" CASCADE;
  DROP TABLE "reports" CASCADE;
  DROP TABLE "contact_messages" CASCADE;
  DROP TABLE "conversations" CASCADE;
  DROP TABLE "conversations_rels" CASCADE;
  DROP TABLE "messages" CASCADE;
  DROP TABLE "whatsapp_submissions" CASCADE;
  DROP TABLE "featured_orders" CASCADE;
  DROP TABLE "inquiries" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "inspections_checklist" CASCADE;
  DROP TABLE "inspections" CASCADE;
  DROP TABLE "phone_otps" CASCADE;
  DROP TABLE "crsp_schedule" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_users_requested_role";
  DROP TYPE "public"."enum_dealers_deals_in";
  DROP TYPE "public"."enum_dealers_county";
  DROP TYPE "public"."enum_dealers_verification_status";
  DROP TYPE "public"."enum_dealers_subscription_tier";
  DROP TYPE "public"."enum_service_providers_services";
  DROP TYPE "public"."enum_service_providers_verification_status";
  DROP TYPE "public"."enum_listings_category";
  DROP TYPE "public"."enum_listings_condition";
  DROP TYPE "public"."enum_listings_transmission";
  DROP TYPE "public"."enum_listings_fuel_type";
  DROP TYPE "public"."enum_listings_body_type";
  DROP TYPE "public"."enum_listings_heavy_machine_specs_equipment_type";
  DROP TYPE "public"."enum_listings_spare_part_details_part_condition";
  DROP TYPE "public"."enum_listings_duty_status";
  DROP TYPE "public"."enum_listings_currency";
  DROP TYPE "public"."enum_listings_county";
  DROP TYPE "public"."enum_listings_status";
  DROP TYPE "public"."enum_listings_moderation_flag";
  DROP TYPE "public"."enum_reviews_target_type";
  DROP TYPE "public"."enum_reviews_status";
  DROP TYPE "public"."enum_reports_target_type";
  DROP TYPE "public"."enum_reports_reason";
  DROP TYPE "public"."enum_reports_status";
  DROP TYPE "public"."enum_contact_messages_status";
  DROP TYPE "public"."enum_whatsapp_submissions_status";
  DROP TYPE "public"."enum_featured_orders_plan";
  DROP TYPE "public"."enum_featured_orders_payment_provider";
  DROP TYPE "public"."enum_featured_orders_status";
  DROP TYPE "public"."enum_inquiries_channel";
  DROP TYPE "public"."enum_inspections_checklist_result";
  DROP TYPE "public"."enum_inspections_status";
  DROP TYPE "public"."enum_inspections_overall_result";
  DROP TYPE "public"."enum_crsp_schedule_fuel_type";
  DROP TYPE "public"."enum_crsp_schedule_category";`)
}
