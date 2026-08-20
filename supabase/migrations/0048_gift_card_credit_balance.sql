-- A $100 store-credit gift card used on a $70 order used to be marked
-- fully redeemed the instant it touched an order, burning the remaining
-- $30 for nothing. remaining_amount tracks what's actually left; the card
-- only becomes fully spent (redeemed_at set) once it hits zero.
alter table gift_cards add column if not exists remaining_amount numeric(10,2);

update gift_cards
set remaining_amount = credit_amount
where type = 'credit' and remaining_amount is null;

-- Atomic, race-free partial spend — same shape as checkout_decrement_stock.
-- `remaining_amount - p_amount` is evaluated against the row's current,
-- live value at the moment this runs, not whatever the caller read
-- earlier, so two checkouts spending from the same balance at the same
-- instant can never together take it below zero.
create or replace function redeem_gift_card_credit(p_code text, p_amount numeric)
returns numeric
language plpgsql
as $$
declare
  v_remaining numeric;
begin
  update gift_cards
  set remaining_amount = remaining_amount - p_amount,
      redeemed_at = case when remaining_amount - p_amount <= 0 then now() else redeemed_at end
  where code = p_code and type = 'credit' and remaining_amount >= p_amount
  returning remaining_amount into v_remaining;

  if v_remaining is null then
    raise exception 'insufficient_or_invalid_gift_card';
  end if;

  return v_remaining;
end;
$$;

-- Gives the amount back if the order that spent it never actually got
-- created (mirrors checkout_restore_stock).
create or replace function restore_gift_card_credit(p_code text, p_amount numeric)
returns void
language plpgsql
as $$
begin
  update gift_cards
  set remaining_amount = remaining_amount + p_amount,
      redeemed_at = null
  where code = p_code;
end;
$$;
