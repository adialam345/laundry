-- Simple Admin User Creation
-- Uses a PL/pgSQL block to safely insert the user if they don't exist,
-- avoiding specific constraint names that might cause errors.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  new_user_id uuid := gen_random_uuid();
BEGIN
  -- Check if user exists by email
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mrxnexsus@laundry.app') THEN
    
    -- 1. Insert into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'mrxnexsus@laundry.app',
      crypt('abcd5678', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- 2. Insert into auth.identities
    -- Note: provider_id for 'email' provider is typically the user_id
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      format('{"sub":"%s","email":"%s"}', new_user_id::text, 'mrxnexsus@laundry.app')::jsonb,
      'email',
      new_user_id::text,
      NULL,
      now(),
      now()
    );
    
  END IF;
END $$;
