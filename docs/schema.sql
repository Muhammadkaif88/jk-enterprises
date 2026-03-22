CREATE TYPE role_type AS ENUM ('admin', 'manager', 'technician');
CREATE TYPE transaction_type AS ENUM ('income', 'purchase', 'expense');
CREATE TYPE project_status AS ENUM ('rd', 'prototyping', 'testing', 'delivered');

CREATE TABLE staff (
    id SERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role role_type NOT NULL DEFAULT 'technician',
    expertise TEXT NOT NULL,
    attendance_status TEXT NOT NULL DEFAULT 'Present',
    assigned_task TEXT,
    salary NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    part_name TEXT NOT NULL,
    category TEXT NOT NULL,
    part_value TEXT,
    package_type TEXT,
    stock_qty INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 10,
    unit_cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    datasheet_url TEXT,
    supplier TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE finance_logs (
    id SERIAL PRIMARY KEY,
    transaction_type transaction_type NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    description TEXT NOT NULL,
    linked_inventory_id INTEGER REFERENCES inventory(id) ON DELETE SET NULL,
    linked_project_id INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE idea_lab (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] NOT NULL DEFAULT '{}',
    is_converted BOOLEAN NOT NULL DEFAULT FALSE,
    created_by INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_vault (
    id SERIAL PRIMARY KEY,
    project_name TEXT NOT NULL,
    client_name TEXT,
    status project_status NOT NULL DEFAULT 'rd',
    documentation_link TEXT,
    firmware_link TEXT,
    notes TEXT,
    idea_source_id INTEGER REFERENCES idea_lab(id) ON DELETE SET NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE project_bom (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES project_vault(id) ON DELETE CASCADE,
    inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE INDEX idx_inventory_category ON inventory(category);
CREATE INDEX idx_finance_type ON finance_logs(transaction_type);
CREATE INDEX idx_project_status ON project_vault(status);
CREATE INDEX idx_idea_converted ON idea_lab(is_converted);
