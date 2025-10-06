This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

-- Updated requisitions table with 4-step approval
CREATE TABLE requisitions (
id SERIAL PRIMARY KEY,
requisition_number VARCHAR(50) UNIQUE,
requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
department VARCHAR(255) NOT NULL,
requester VARCHAR(255) NOT NULL,
requester_user_id VARCHAR(255),
status VARCHAR(50) NOT NULL DEFAULT 'pending',
total_items INTEGER DEFAULT 0,

    -- Four approval stages
    technical_manager_c_approved_by VARCHAR(255) DEFAULT NULL,
    technical_manager_c_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    technical_manager_m_approved_by VARCHAR(255) DEFAULT NULL,
    technical_manager_m_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    senior_assistant_director_approved_by VARCHAR(255) DEFAULT NULL,
    senior_assistant_director_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    quality_assurance_manager_approved_by VARCHAR(255) DEFAULT NULL,
    quality_assurance_manager_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    -- Rejection tracking
    rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    rejected_by VARCHAR(255) DEFAULT NULL,
    rejected_by_role VARCHAR(50) DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,

    -- Completion tracking
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_status CHECK (status IN (
        'pending',
        'approved_by_technical_manager_c',
        'approved_by_technical_manager_m',
        'approved_by_senior_assistant_director',
        'approved',
        'rejected',
        'cancelled'
    ))

);

CREATE TABLE requisition_items (
id SERIAL PRIMARY KEY,
requisition_id INTEGER NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
chemical_item_id INTEGER NOT NULL REFERENCES chemical_items(id),
requested_quantity DECIMAL(10, 3) NOT NULL CHECK (requested_quantity > 0),
approved_quantity DECIMAL(10, 3) DEFAULT 0 CHECK (approved_quantity >= 0),
unit VARCHAR(50) NOT NULL DEFAULT '',
expiry_date DATE NOT NULL DEFAULT '1900-01-01',
remark TEXT DEFAULT '',
is_processed BOOLEAN DEFAULT FALSE,
processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE requisition_audit_log (
id BIGSERIAL PRIMARY KEY,
requisition_id INTEGER NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
action VARCHAR(50) NOT NULL,
performed_by VARCHAR(255) NOT NULL,
performed_by_role VARCHAR(50),
old_status VARCHAR(50),
new_status VARCHAR(50),
details JSONB,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE inventory_transactions (
id BIGSERIAL PRIMARY KEY,
chemical_item_id INTEGER NOT NULL REFERENCES chemical_items(id),
requisition_item_id INTEGER REFERENCES requisition_items(id),
transaction_type VARCHAR(50) NOT NULL,
quantity_change DECIMAL(10, 3) NOT NULL,
quantity_before DECIMAL(10, 3) NOT NULL,
quantity_after DECIMAL(10, 3) NOT NULL,
performed_by VARCHAR(255),
reason TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Item Requisitions Table
CREATE TABLE admin_item_requisitions (
id SERIAL PRIMARY KEY,
requisition_number VARCHAR(50) UNIQUE,
requisition_date DATE NOT NULL DEFAULT CURRENT_DATE,
department VARCHAR(255) NOT NULL,
requester VARCHAR(255) NOT NULL,
requester_user_id VARCHAR(255),
status VARCHAR(50) NOT NULL DEFAULT 'pending',
total_items INTEGER DEFAULT 0,

    technical_manager_c_approved_by VARCHAR(255) DEFAULT NULL,
    technical_manager_c_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    technical_manager_m_approved_by VARCHAR(255) DEFAULT NULL,
    technical_manager_m_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    senior_assistant_director_approved_by VARCHAR(255) DEFAULT NULL,
    senior_assistant_director_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    quality_assurance_manager_approved_by VARCHAR(255) DEFAULT NULL,
    quality_assurance_manager_approved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    rejected_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    rejected_by VARCHAR(255) DEFAULT NULL,
    rejected_by_role VARCHAR(50) DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,

    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_admin_status CHECK (status IN (
        'pending',
        'approved_by_technical_manager_c',
        'approved_by_technical_manager_m',
        'approved_by_senior_assistant_director',
        'approved',
        'rejected',
        'cancelled'
    ))

);

-- Admin Item Requisition Items Table
CREATE TABLE admin_item_requisition_items (
id SERIAL PRIMARY KEY,
requisition_id INTEGER NOT NULL REFERENCES admin_item_requisitions(id) ON DELETE CASCADE,
admin_item_id INTEGER NOT NULL REFERENCES admin_items(id),
requested_quantity DECIMAL(10, 3) NOT NULL CHECK (requested_quantity > 0),
approved_quantity DECIMAL(10, 3) DEFAULT 0 CHECK (approved_quantity >= 0),
unit VARCHAR(50) NOT NULL DEFAULT '',
remark TEXT DEFAULT '',
is_processed BOOLEAN DEFAULT FALSE,
processed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Item Requisition Audit Log
CREATE TABLE admin_item_requisition_audit_log (
id BIGSERIAL PRIMARY KEY,
requisition_id INTEGER NOT NULL REFERENCES admin_item_requisitions(id) ON DELETE CASCADE,
action VARCHAR(50) NOT NULL,
performed_by VARCHAR(255) NOT NULL,
performed_by_role VARCHAR(50),
old_status VARCHAR(50),
new_status VARCHAR(50),
details JSONB,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Item Inventory Transactions
CREATE TABLE admin_item_inventory_transactions (
id BIGSERIAL PRIMARY KEY,
admin_item_id INTEGER NOT NULL REFERENCES admin_items(id),
requisition_item_id INTEGER REFERENCES admin_item_requisition_items(id),
transaction_type VARCHAR(50) NOT NULL,
quantity_change DECIMAL(10, 3) NOT NULL,
quantity_before DECIMAL(10, 3) NOT NULL,
quantity_after DECIMAL(10, 3) NOT NULL,
performed_by VARCHAR(255),
reason TEXT,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

create table public.chemical_items (
id serial not null,
registration_id integer not null,
chemical_name character varying(255) not null,
quantity numeric(10, 3) not null,
expiry_date date not null,
remark text null default ''::text,
created_at timestamp with time zone null default CURRENT_TIMESTAMP,
updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
unit character varying(50) null default ''::character varying,
constraint chemical_items_pkey primary key (id),
constraint chemical_items_registration_id_fkey foreign KEY (registration_id) references chemical_registrations (id) on delete CASCADE,
constraint chemical_items_quantity_check check ((quantity >= (0)::numeric))
)

create table public.chemical_registrations (
id serial not null,
registration_date date not null,
department character varying(255) not null,
created_at timestamp with time zone null default CURRENT_TIMESTAMP,
updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
store_officer character varying(255) not null default 'Unknown'::character varying,
supplier character varying(255) not null default 'Unknown'::character varying,
constraint chemical_registrations_pkey primary key (id)
)

create table admin_registrations (
id serial not null,
registration_date date not null,
department text not null,
store_officer text not null,
supplier text not null,
created_at timestamp without time zone null default CURRENT_TIMESTAMP,
updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
constraint admin_registrations_pkey primary key (id)
)

create table admin_items (
id serial not null,
registration_id integer null,
item_name text not null,
quantity numeric not null,
remark text null,
unit text not null,
created_at timestamp without time zone null default CURRENT_TIMESTAMP,
updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
constraint admin_items_pkey primary key (id),
constraint admin_items_registration_id_fkey foreign KEY (registration_id) references admin_registrations (id)
)

create table public.suppliers (
id bigserial not null,
name text not null,
address text not null,
remarks text not null,
created_at timestamp with time zone null default now(),
updated_at timestamp with time zone null default now(),
constraint suppliers_pkey primary key (id)
)

create table public.products (
id serial not null,
name character varying(100) not null,
unit character varying(10) null,
uses text null,
constraint products_pkey primary key (id)
)
