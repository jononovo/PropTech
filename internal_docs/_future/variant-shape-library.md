# Variant shape library (saved descriptor conventions)

Status: DISCUSSION — captured Jul 25, 2026.

## The problem
Every template author hand-writes variantConfig (noun + descriptor fields). Different templates
will drift ("Bank statements" vs "bank_stmt", last4 vs acct_last_four) and the descriptor KEYS are
mint-stable, so drift is forever.

## Direction (user)
- Variant shapes should be SAVABLE and reusable across templates — precedent: the existing
  saved-sections feature (same UX: save from the builder, pick from a library).
- Ship PRESETS for the most common document types (top ~20): bank statement (institution + last4),
  ID/passport (holder + document number), title deed (property + parcel), pay stub (employer +
  period), etc. Presets seed the library; they are starting points, not locks.
- Builder UX: variant section offers a dropdown — preset / saved shape / fully custom. Custom
  stays open (people must be able to add fields), but picking a shared shape keeps keys identical
  across templates, which is what makes cross-template tooling (satisfaction pass, approved-doc
  naming) coherent.
- Note: a set block with ONE variant is legitimate — the shape then just documents the naming
  convention and format being requested. That's a feature, not a smell.

## Build notes
- Mirror saved-sections: small library table/store + list/create endpoints + builder picker.
- A saved shape = { name, variantNoun, descriptorFields, docsPerVariant defaults }.
- Copy-on-use (template gets its own copy, no live linkage) — same rule as saved sections,
  avoids action-at-a-distance when a shape is later edited.
