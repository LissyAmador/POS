-- =============================================================================
-- POS Multi-tenant SaaS - Datos de prueba y Superadministrador
-- Ejecutar DESPUÉS de schema.sql
-- =============================================================================

-- 1. Organización y sucursal demo
INSERT INTO public.tenants (id, name)
VALUES ('a0000000-0000-4000-8000-000000000001', 'Organización Demo POS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.branches (id, tenant_id, name, address)
VALUES (
  'b0000000-0000-4000-8000-000000000001',
  'a0000000-0000-4000-8000-000000000001',
  'Sucursal Principal',
  'Av. Principal #100, Ciudad Demo'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Productos de ejemplo
INSERT INTO public.products (id, tenant_id, name, sku, barcode, price, cost) VALUES
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Café Americano', 'CAF-001', '7501234567890', 45.00, 15.00),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Sandwich Jamón', 'SAN-001', '7501234567891', 65.00, 28.00),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Agua 600ml', 'AGU-001', '7501234567892', 18.00, 6.00),
  ('c0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'Galletas Pack', 'GAL-001', '7501234567893', 32.00, 14.00),
  ('c0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'Refresco 355ml', 'REF-001', '7501234567894', 25.00, 10.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Inventario inicial por sucursal
INSERT INTO public.inventory (branch_id, product_id, stock) VALUES
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 100),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000002', 50),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000003', 200),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 80),
  ('b0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 120)
ON CONFLICT (branch_id, product_id) DO UPDATE SET stock = EXCLUDED.stock;

-- -----------------------------------------------------------------------------
-- 4. SUPERADMINISTRADOR DE PRUEBA
-- -----------------------------------------------------------------------------
-- Paso A: En Supabase Dashboard > Authentication > Users > Add user:
--   Email:    superadmin@pos.demo
--   Password: SuperAdmin123!
--   (marcar "Auto Confirm User")
--
-- Paso B: Copiar el UUID del usuario creado y ejecutar:
--
-- SELECT public.link_superadmin('PEGAR_UUID_DEL_USUARIO_AQUI');
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.link_superadmin(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users_profiles (user_id, tenant_id, branch_id, role)
  VALUES (
    p_user_id,
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'admin_org'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET tenant_id = EXCLUDED.tenant_id,
      branch_id = EXCLUDED.branch_id,
      role = 'admin_org';
END;
$$;

-- Permite ejecutar link_superadmin sin sesión (solo durante setup inicial)
GRANT EXECUTE ON FUNCTION public.link_superadmin TO anon, authenticated, service_role;

-- Política bootstrap: permite al superadmin leer su perfil tras vinculación
-- (las demás políticas ya cubren operaciones normales)
