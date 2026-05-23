-- CashCompass Database Schema
-- Run this in Supabase SQL Editor after creating the project

-- =============================================
-- 1. Tables
-- =============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_currency VARCHAR(3) NOT NULL DEFAULT 'KRW',
  language VARCHAR(5) NOT NULL DEFAULT 'ko',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('credit_card', 'bank_account')),
  name VARCHAR(100) NOT NULL,
  billing_start_day SMALLINT CHECK (billing_start_day BETWEEN 1 AND 28),
  billing_end_day SMALLINT CHECK (billing_end_day BETWEEN 0 AND 28),
  payment_day SMALLINT CHECK (payment_day BETWEEN 1 AND 28),
  payment_month_offset SMALLINT DEFAULT 1 CHECK (payment_month_offset BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT credit_card_fields CHECK (
    type = 'bank_account' OR (
      billing_start_day IS NOT NULL AND
      billing_end_day IS NOT NULL AND
      payment_day IS NOT NULL
    )
  )
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id),
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  payment_date DATE NOT NULL,
  note TEXT,
  receipt_path VARCHAR(500),
  is_split BOOLEAN NOT NULL DEFAULT false,
  split_count SMALLINT CHECK (split_count > 0),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transaction_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  recognition_month DATE NOT NULL,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  sort_order SMALLINT NOT NULL DEFAULT 1
);

CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  monthly_limit DECIMAL(15,2) NOT NULL CHECK (monthly_limit > 0),
  currency VARCHAR(3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, category_id)
);

-- =============================================
-- 2. Indexes
-- =============================================

CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_user_payment_date ON transactions(user_id, payment_date DESC);
CREATE INDEX idx_transactions_user_category ON transactions(user_id, category_id);
CREATE INDEX idx_transactions_payment_method ON transactions(payment_method_id);

CREATE INDEX idx_allocations_month ON transaction_allocations(recognition_month);
CREATE INDEX idx_allocations_transaction ON transaction_allocations(transaction_id);
CREATE INDEX idx_allocations_txn_month ON transaction_allocations(transaction_id, recognition_month);

CREATE INDEX idx_categories_user ON categories(user_id, sort_order);
CREATE INDEX idx_payment_methods_user ON payment_methods(user_id);
CREATE INDEX idx_budgets_user ON budgets(user_id);

-- =============================================
-- 3. Row Level Security
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own profile"
  ON profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own payment methods"
  ON payment_methods FOR ALL USING (auth.uid() = user_id);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own categories"
  ON categories FOR ALL USING (auth.uid() = user_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);

ALTER TABLE transaction_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own allocations"
  ON transaction_allocations FOR ALL USING (
    EXISTS (
      SELECT 1 FROM transactions t
      WHERE t.id = transaction_allocations.transaction_id
      AND t.user_id = auth.uid()
    )
  );

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access own budgets"
  ON budgets FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- 4. Triggers & Functions
-- =============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile + default categories on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_lang TEXT;
  cat_names TEXT[];
BEGIN
  INSERT INTO profiles (id, default_currency, language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'default_currency', 'KRW'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'ko')
  );

  user_lang := COALESCE(NEW.raw_user_meta_data->>'language', 'ko');

  IF user_lang = 'ko' THEN
    cat_names := ARRAY['식비','교통','주거','공과금','여가/문화','의료/건강','급여','기타'];
  ELSE
    cat_names := ARRAY['Food','Transport','Housing','Utilities','Leisure','Medical','Salary','Other'];
  END IF;

  FOR i IN 1..array_length(cat_names, 1) LOOP
    INSERT INTO categories (user_id, name, is_default, sort_order)
    VALUES (NEW.id, cat_names[i], true, i);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 5. Storage
-- =============================================

INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);

CREATE POLICY "Users can access own receipts"
  ON storage.objects FOR ALL USING (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
