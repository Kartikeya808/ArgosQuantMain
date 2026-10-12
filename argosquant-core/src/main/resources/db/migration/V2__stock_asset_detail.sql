-- Subclass-specific columns for the FinancialAsset hierarchy.
-- Nullable because they only apply to one asset type each:
--   sector           -> Equity
--   underlying_index -> EtfAsset
ALTER TABLE stocks ADD COLUMN sector           TEXT;
ALTER TABLE stocks ADD COLUMN underlying_index TEXT;
