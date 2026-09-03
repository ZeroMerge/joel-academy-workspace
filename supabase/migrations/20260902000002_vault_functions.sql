-- JOEL OS Vault Access Functions

-- We return BYTEA so the backend (which holds the VAULT_ENCRYPTION_KEY) can decrypt it.
-- This keeps the encryption key out of the database entirely.
CREATE OR REPLACE FUNCTION public.reveal_vault_secret(target_resource_id UUID)
RETURNS BYTEA AS $$
DECLARE
    secret_val BYTEA;
    grant_record RECORD;
BEGIN
    -- 1. Check for an active grant
    SELECT * INTO grant_record 
    FROM public.vault_grants 
    WHERE resource_id = target_resource_id 
      AND user_id = auth.uid()
      AND expires_at > now();
      
    IF NOT FOUND THEN
        -- Check if the user is an Admin (Admins might need to reveal any secret)
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied or grant expired';
        END IF;
    ELSE
        -- 2. Update last_used_at and push expires_at forward by 7 days
        UPDATE public.vault_grants 
        SET last_used_at = now(),
            expires_at = now() + interval '7 days'
        WHERE id = grant_record.id;
    END IF;
    
    -- 3. Log the access in the audit log
    INSERT INTO public.audit_log (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
        auth.uid(), 
        'reveal_secret', 
        'vault_resources', 
        target_resource_id, 
        jsonb_build_object('grant_id', grant_record.id, 'is_admin_override', grant_record IS NULL)
    );
    
    -- 4. Retrieve and return the encrypted secret
    SELECT encrypted_value INTO secret_val 
    FROM public.vault_secrets 
    WHERE resource_id = target_resource_id;
    
    RETURN secret_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
