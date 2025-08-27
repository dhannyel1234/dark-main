-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_configs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_configs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.coupons (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  code text NOT NULL UNIQUE,
  discount integer NOT NULL,
  active boolean DEFAULT true,
  expires_at timestamp with time zone,
  usage_limit integer,
  usage_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.disk_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  user_disk_id uuid NOT NULL,
  vm_id uuid NOT NULL,
  plan_id bigint NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'active'::session_status,
  session_duration_minutes integer NOT NULL,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  ended_at timestamp with time zone,
  warning_10min_sent boolean NOT NULL DEFAULT false,
  warning_5min_sent boolean NOT NULL DEFAULT false,
  warning_1min_sent boolean NOT NULL DEFAULT false,
  last_activity_at timestamp with time zone DEFAULT now(),
  termination_reason text,
  CONSTRAINT disk_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT disk_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT disk_sessions_user_disk_id_fkey FOREIGN KEY (user_disk_id) REFERENCES public.user_disks(id),
  CONSTRAINT disk_sessions_vm_id_fkey FOREIGN KEY (vm_id) REFERENCES public.disk_vms(id),
  CONSTRAINT disk_sessions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.disk_vms (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL UNIQUE,
  azure_vm_id text,
  azure_vm_name text,
  location text NOT NULL DEFAULT 'East US'::text,
  vm_size text NOT NULL DEFAULT 'Standard_B2s'::text,
  resource_group text NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'maintenance'::vm_disk_status,
  public_ip text,
  private_ip text,
  username text NOT NULL DEFAULT 'azureuser'::text,
  password text NOT NULL,
  max_concurrent_users integer NOT NULL DEFAULT 1,
  current_users integer NOT NULL DEFAULT 0,
  last_maintenance_at timestamp with time zone DEFAULT now(),
  CONSTRAINT disk_vms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.invoices (
  id text NOT NULL,
  machine_name text NOT NULL,
  expiration_date timestamp with time zone NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.machines (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  surname text NOT NULL,
  host USER-DEFINED NOT NULL,
  plan_name text NOT NULL,
  plan_expiration_date timestamp with time zone NOT NULL,
  connect_user text NOT NULL,
  connect_password text NOT NULL,
  owner_id uuid NOT NULL,
  opened_invoice boolean NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT machines_pkey PRIMARY KEY (id),
  CONSTRAINT machines_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.maintenance (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  active integer DEFAULT 0,
  message text DEFAULT 'Estamos realizando melhorias em nossos sistemas.'::text,
  estimated_end_time timestamp with time zone,
  start_time timestamp with time zone DEFAULT now(),
  contact_email text DEFAULT 'suporte@darkcloud.store'::text,
  CONSTRAINT maintenance_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payment_gateways (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  confirmation_type text NOT NULL DEFAULT 'webhook'::text CHECK (confirmation_type = ANY (ARRAY['webhook'::text, 'polling'::text])),
  polling_interval_seconds integer,
  CONSTRAINT payment_gateways_pkey PRIMARY KEY (id)
);
CREATE TABLE public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  custom_id text,
  payment_id text,
  email text,
  plan_id bigint,
  checked_all boolean,
  machine_created boolean,
  timeout_id text,
  coupon_id bigint,
  discount_percent integer DEFAULT 0,
  br_code text,
  qr_code_image text,
  price numeric DEFAULT 0.00,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  status text DEFAULT 'pending'::text,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  customer_name text,
  customer_document text,
  customer_birth_date date,
  customer_phone text,
  customer_address jsonb,
  terms_accepted boolean,
  gateway_provider text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id),
  CONSTRAINT payments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT payments_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.plans (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  price numeric NOT NULL,
  duration_days integer,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  provisioning_type text NOT NULL DEFAULT 'automatico'::text,
  individual_stock integer NOT NULL DEFAULT 10,
  stock_pool_id uuid,
  highlight_color text,
  vm_config jsonb,
  session_duration_minutes integer NOT NULL DEFAULT 60,
  max_concurrent_sessions integer NOT NULL DEFAULT 1,
  CONSTRAINT plans_pkey PRIMARY KEY (id),
  CONSTRAINT fk_stock_pool FOREIGN KEY (stock_pool_id) REFERENCES public.stock_pools(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  discord_username text,
  avatar_url text,
  admin_level USER-DEFINED NOT NULL DEFAULT 'user'::admin_level,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.queue (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  position integer NOT NULL,
  status USER-DEFINED DEFAULT 'waiting'::queue_status,
  joined_at timestamp with time zone DEFAULT now(),
  activated_at timestamp with time zone,
  completed_at timestamp with time zone,
  machine_id bigint,
  disk_session_id uuid,
  plan_id bigint,
  CONSTRAINT queue_pkey PRIMARY KEY (id),
  CONSTRAINT queue_disk_session_id_fkey FOREIGN KEY (disk_session_id) REFERENCES public.disk_sessions(id),
  CONSTRAINT queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT queue_machine_id_fkey FOREIGN KEY (machine_id) REFERENCES public.queue_machines(id),
  CONSTRAINT queue_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);
CREATE TABLE public.queue_machines (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  ip text NOT NULL,
  user text NOT NULL,
  password text NOT NULL,
  status USER-DEFINED DEFAULT 'available'::queue_machine_status,
  current_user_id uuid,
  last_used timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT queue_machines_pkey PRIMARY KEY (id),
  CONSTRAINT queue_machines_current_user_id_fkey FOREIGN KEY (current_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.stock_pools (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  CONSTRAINT stock_pools_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_disks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  disk_name text NOT NULL,
  azure_disk_id text,
  azure_snapshot_id text,
  status USER-DEFINED NOT NULL DEFAULT 'available'::disk_status,
  size_gb integer NOT NULL DEFAULT 30,
  disk_type text NOT NULL DEFAULT 'Standard_LRS'::text,
  last_used_at timestamp with time zone,
  created_by_admin uuid,
  notes text,
  CONSTRAINT user_disks_pkey PRIMARY KEY (id),
  CONSTRAINT user_disks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_disks_created_by_admin_fkey FOREIGN KEY (created_by_admin) REFERENCES public.profiles(id)
);
CREATE TABLE public.user_plans (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  plan_id bigint NOT NULL,
  status USER-DEFINED DEFAULT 'active'::user_plan_status,
  activated_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  charge_id text NOT NULL,
  payment_value numeric NOT NULL,
  is_in_queue boolean DEFAULT false,
  queue_started_at timestamp with time zone,
  alfa_time_left_ms bigint,
  cancel_date timestamp with time zone,
  cancel_reason text,
  last_queue_exit timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_plans_pkey PRIMARY KEY (id),
  CONSTRAINT user_plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_plans_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);