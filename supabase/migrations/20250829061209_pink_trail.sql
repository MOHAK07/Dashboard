/*
  # Fix User Profiles and Role-Based Authentication

  1. Database Schema Updates
    - Ensure proper foreign key constraints
    - Fix user profile creation trigger
    - Add proper RLS policies for role-based access

  2. Security
    - Enable RLS on all tables
    - Add role-based policies for admin/operator access
    - Ensure proper user profile creation

  3. Trigger Function
    - Fix handle_new_user function to properly create profiles
    - Add error handling for profile creation
*/

-- First, ensure the Profiles table has proper structure
CREATE TABLE IF NOT EXISTS "Profiles" (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on Profiles table
ALTER TABLE "Profiles" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON "Profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "Profiles";
DROP POLICY IF EXISTS "Admins can view all profiles" ON "Profiles";
DROP POLICY IF EXISTS "Enable insert for all users" ON "Profiles";

-- Create proper RLS policies for Profiles
CREATE POLICY "Users can view own profile"
  ON "Profiles"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON "Profiles"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON "Profiles"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable profile creation for new users"
  ON "Profiles"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Fix the handle_new_user function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert new profile with default operator role
  INSERT INTO public."Profiles" (id, role)
  VALUES (NEW.id, 'operator')
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Add role-based policies to existing tables
-- FOM table policies
DROP POLICY IF EXISTS "Admins can manage FOM data" ON "FOM";
DROP POLICY IF EXISTS "Operators can view FOM data" ON "FOM";

CREATE POLICY "Admins can manage FOM data"
  ON "FOM"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view FOM data"
  ON "FOM"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- LFOM table policies
DROP POLICY IF EXISTS "Admins can manage LFOM data" ON "LFOM";
DROP POLICY IF EXISTS "Operators can view LFOM data" ON "LFOM";

CREATE POLICY "Admins can manage LFOM data"
  ON "LFOM"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view LFOM data"
  ON "LFOM"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- Similar policies for other tables
-- POS LFOM
DROP POLICY IF EXISTS "Admins can manage POS LFOM data" ON "POS LFOM";
DROP POLICY IF EXISTS "Operators can view POS LFOM data" ON "POS LFOM";

CREATE POLICY "Admins can manage POS LFOM data"
  ON "POS LFOM"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view POS LFOM data"
  ON "POS LFOM"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- POS FOM
DROP POLICY IF EXISTS "Admins can manage POS FOM data" ON "POS FOM";
DROP POLICY IF EXISTS "Operators can view POS FOM data" ON "POS FOM";

CREATE POLICY "Admins can manage POS FOM data"
  ON "POS FOM"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view POS FOM data"
  ON "POS FOM"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- MDA claim
DROP POLICY IF EXISTS "Admins can manage MDA claim data" ON "MDA claim";
DROP POLICY IF EXISTS "Operators can view MDA claim data" ON "MDA claim";

CREATE POLICY "Admins can manage MDA claim data"
  ON "MDA claim"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view MDA claim data"
  ON "MDA claim"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );

-- Stock
DROP POLICY IF EXISTS "Admins can manage Stock data" ON "Stock";
DROP POLICY IF EXISTS "Operators can view Stock data" ON "Stock";

CREATE POLICY "Admins can manage Stock data"
  ON "Stock"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Operators can view Stock data"
  ON "Stock"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Profiles" 
      WHERE id = auth.uid() AND role IN ('admin', 'operator')
    )
  );