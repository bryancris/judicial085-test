
-- Phase 1: Core Infrastructure Setup

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'firm_admin', 'attorney', 'paralegal');

-- 2. Create law_firms table
CREATE TABLE public.law_firms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- 3. Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 4. Create firm_users table to associate users with law firms
CREATE TABLE public.firm_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    firm_id UUID REFERENCES public.law_firms(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE (user_id, firm_id)
);

-- 5. Create profiles table for additional user information
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Enable RLS on all new tables
ALTER TABLE public.law_firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.firm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Create security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- 8. Create function to get user's firm_id
CREATE OR REPLACE FUNCTION public.get_user_firm_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
    SELECT firm_id
    FROM public.firm_users
    WHERE user_id = _user_id
    AND is_active = true
    LIMIT 1
$$;

-- 9. Create RLS policies for law_firms table
CREATE POLICY "Super admins can view all firms" ON public.law_firms
    FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own firm" ON public.law_firms
    FOR SELECT USING (id = public.get_user_firm_id(auth.uid()));

CREATE POLICY "Super admins can insert firms" ON public.law_firms
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update firms" ON public.law_firms
    FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- 10. Create RLS policies for user_roles table
CREATE POLICY "Super admins can view all user roles" ON public.user_roles
    FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can insert user roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update user roles" ON public.user_roles
    FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- 11. Create RLS policies for firm_users table
CREATE POLICY "Super admins can view all firm users" ON public.firm_users
    FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own firm association" ON public.firm_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Super admins can insert firm users" ON public.firm_users
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update firm users" ON public.firm_users
    FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

-- 12. Create RLS policies for profiles table
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Super admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Super admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Super admins can insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 13. Create trigger function to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, first_name, last_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- 14. Create trigger to automatically create profile on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 15. Set bryan.m@quraishimd.com as super admin
-- First create a default law firm for existing setup
INSERT INTO public.law_firms (name, email, is_active)
VALUES ('Default Law Firm', 'bryan.m@quraishimd.com', true);

-- Get the firm ID for reference
DO $$
DECLARE
    default_firm_id UUID;
    bryan_user_id UUID;
BEGIN
    -- Get the default firm ID
    SELECT id INTO default_firm_id FROM public.law_firms WHERE email = 'bryan.m@quraishimd.com';
    
    -- Get Bryan's user ID from auth.users (if exists)
    SELECT id INTO bryan_user_id FROM auth.users WHERE email = 'bryan.m@quraishimd.com';
    
    -- If Bryan's account exists, set up his roles and firm association
    IF bryan_user_id IS NOT NULL THEN
        -- Insert super admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (bryan_user_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        -- Associate with default firm
        INSERT INTO public.firm_users (user_id, firm_id)
        VALUES (bryan_user_id, default_firm_id)
        ON CONFLICT (user_id, firm_id) DO NOTHING;
        
        -- Update profile if exists
        INSERT INTO public.profiles (id, email)
        VALUES (bryan_user_id, 'bryan.m@quraishimd.com')
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
    END IF;
END $$;

-- 16. Update existing clients table to include firm association
ALTER TABLE public.clients ADD COLUMN firm_id UUID REFERENCES public.law_firms(id);

-- Associate all existing clients with the default firm
UPDATE public.clients 
SET firm_id = (SELECT id FROM public.law_firms WHERE email = 'bryan.m@quraishimd.com')
WHERE firm_id IS NULL;

-- 17. Update RLS policies for clients table to include firm-based access
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;

-- Enable RLS if not already enabled
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create new firm-based RLS policies for clients
CREATE POLICY "Super admins can view all clients" ON public.clients
    FOR SELECT USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view clients from their firm" ON public.clients
    FOR SELECT USING (firm_id = public.get_user_firm_id(auth.uid()));

CREATE POLICY "Users can insert clients to their firm" ON public.clients
    FOR INSERT WITH CHECK (firm_id = public.get_user_firm_id(auth.uid()));

CREATE POLICY "Users can update clients from their firm" ON public.clients
    FOR UPDATE USING (firm_id = public.get_user_firm_id(auth.uid()));

CREATE POLICY "Super admins can update all clients" ON public.clients
    FOR UPDATE USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can delete clients from their firm" ON public.clients
    FOR DELETE USING (firm_id = public.get_user_firm_id(auth.uid()));

CREATE POLICY "Super admins can delete all clients" ON public.clients
    FOR DELETE USING (public.has_role(auth.uid(), 'super_admin'));
