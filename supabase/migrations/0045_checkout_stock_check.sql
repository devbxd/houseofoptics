-- Atomically validates and decrements stock for every line of an order in
-- a single transaction, so two customers racing on the last unit can't
-- both succeed, and a null stock value (= not tracked) is never blocked.
-- Raises 'insufficient_stock' if any line can't be fulfilled, which rolls
-- back every decrement already applied earlier in the same call.
create or replace function checkout_decrement_stock(items jsonb)
returns void
language plpgsql
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_updated integer;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_variant_id := nullif(item->>'variant_id', '')::uuid;
    v_quantity := (item->>'quantity')::integer;

    if v_variant_id is not null then
      update product_variants
      set stock = stock - v_quantity
      where id = v_variant_id and (stock is null or stock >= v_quantity);
      get diagnostics v_updated = row_count;
      if v_updated = 0 then
        raise exception 'insufficient_stock:variant:%', v_variant_id;
      end if;
    else
      update products
      set stock = stock - v_quantity
      where id = v_product_id and (stock is null or stock >= v_quantity);
      get diagnostics v_updated = row_count;
      if v_updated = 0 then
        raise exception 'insufficient_stock:product:%', v_product_id;
      end if;
    end if;
  end loop;
end;
$$;

-- Companion to the above — used to give stock back if an order fails to
-- save *after* stock was already decremented for it, so a failed checkout
-- doesn't permanently lose inventory.
create or replace function checkout_restore_stock(items jsonb)
returns void
language plpgsql
as $$
declare
  item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    v_product_id := (item->>'product_id')::uuid;
    v_variant_id := nullif(item->>'variant_id', '')::uuid;
    v_quantity := (item->>'quantity')::integer;

    if v_variant_id is not null then
      update product_variants set stock = stock + v_quantity where id = v_variant_id;
    else
      update products set stock = stock + v_quantity where id = v_product_id;
    end if;
  end loop;
end;
$$;
