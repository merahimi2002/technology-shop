BEGIN;

-- Concurrent inserts/promotions cannot create a second owner. ADMIN remains unrestricted.
CREATE UNIQUE INDEX "User_single_owner" ON public."User" ("role") WHERE "role" = 'OWNER';

-- Ownership/credential recovery is an offline, privileged maintenance operation.
CREATE FUNCTION public.protect_shop_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF OLD."role" = 'OWNER' THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'Owner deletion requires privileged offline recovery' USING ERRCODE = '42501';
    END IF;
    IF ROW(NEW."id", NEW."role", NEW."email", NEW."passwordHash", NEW."disabledAt")
       IS DISTINCT FROM
       ROW(OLD."id", OLD."role", OLD."email", OLD."passwordHash", OLD."disabledAt") THEN
      RAISE EXCEPTION 'Owner identity and credentials require privileged offline recovery' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.protect_shop_owner() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER "User_protect_owner" BEFORE UPDATE OR DELETE ON public."User"
FOR EACH ROW EXECUTE FUNCTION public.protect_shop_owner();

COMMIT;
