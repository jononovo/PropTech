/**
 * Reducer invariant tests — plain asserts, no framework.
 * Run from repo root:  pnpm dlx tsx artifacts/client/src/features/template-editor/state/templateReducer.test.ts
 */
import assert from "node:assert/strict";
import type { Template } from "@workspace/api-client-react";
import { templateReducer } from "./templateReducer";

const base = (): Template => ({
  template: "T",
  version: 1,
  status: "draft",
  program: "P",
  alternatives: [{ id: "g1", name: "ID proof", primary: "gov-id", satisfiedBy: ["passport"] }],
  sections: [
    {
      id: "sec-a",
      name: "Section A",
      owner: "Originator",
      permissions: [{ role: "Applicant", view: true, upload: true }],
      subsections: [
        {
          id: "sub-a1",
          name: "Sub A1",
          blocks: [
            { kind: "document", id: "gov-id", name: "Government ID" },
            { kind: "document", id: "passport", name: "Passport" },
          ],
        },
        { id: "sub-a2", name: "Sub A2", blocks: [{ kind: "document", id: "deed", name: "Deed" }] },
      ],
    },
    {
      id: "sec-b",
      name: "Section B",
      owner: "Escrow",
      permissions: [{ role: "Applicant", view: false, upload: false }],
      subsections: [{ id: "sub-b1", name: "Sub B1", blocks: [] }],
    },
  ],
});

// 1. Active templates are immutable — every action no-ops.
{
  const active = { ...base(), status: "active" as const };
  const out = templateReducer(active, { type: "ADD_SECTION" });
  assert.equal(out, active, "active template must be untouched");
}

// 2. Rename never changes ids (THE id-stability invariant).
{
  let t = base();
  t = templateReducer(t, { type: "UPDATE_BLOCK", blockId: "gov-id", patch: { name: "State ID" } });
  assert.equal(t.sections[0]!.subsections[0]!.blocks[0]!.id, "gov-id");
  assert.equal(t.sections[0]!.subsections[0]!.blocks[0]!.name, "State ID");
  t = templateReducer(t, { type: "RENAME_SECTION", sectionId: "sec-a", name: "Renamed" });
  assert.equal(t.sections[0]!.id, "sec-a");
}

// 3. Moves never change ids or lose blocks (reorder + cross-container).
{
  let t = base();
  t = templateReducer(t, { type: "MOVE_SECTION", fromIndex: 0, toIndex: 1 });
  assert.deepEqual(t.sections.map((s) => s.id), ["sec-b", "sec-a"]);
  t = templateReducer(t, {
    type: "MOVE_BLOCK", fromSubsectionId: "sub-a1", toSubsectionId: "sub-b1", fromIndex: 0, toIndex: 0,
  });
  assert.equal(t.sections[0]!.subsections[0]!.blocks[0]!.id, "gov-id", "moved block keeps id");
  const allIds = t.sections.flatMap((s) => s.subsections.flatMap((ss) => ss.blocks.map((b) => b.id)));
  assert.deepEqual(allIds.sort(), ["deed", "gov-id", "passport"], "no block lost or duplicated");
}

// 4. New entities mint unique slug ids; collisions get -2 suffix.
{
  let t = base();
  t = templateReducer(t, { type: "ADD_BLOCK", subsectionId: "sub-b1", kind: "document", name: "Deed" });
  const added = t.sections[1]!.subsections[0]!.blocks[0]!;
  assert.equal(added.id, "deed-2", "slug collision must suffix, never reuse");
  assert.equal(added.requirement, "required");
  assert.equal(added.expiry, null);
}

// 5. Removing a block prunes dangling alternative references.
{
  let t = base();
  t = templateReducer(t, { type: "REMOVE_BLOCK", blockId: "passport" });
  assert.equal(t.alternatives.length, 0, "group with empty satisfiedBy must die");
  let t2 = base();
  t2 = templateReducer(t2, { type: "REMOVE_BLOCK", blockId: "gov-id" });
  assert.equal(t2.alternatives.length, 0, "group whose primary is removed must die");
}

// 6. Removing a section prunes alternatives referencing its blocks.
{
  let t = base();
  t = templateReducer(t, { type: "REMOVE_SECTION", sectionId: "sec-a" });
  assert.equal(t.sections.length, 1);
  assert.equal(t.alternatives.length, 0);
}

// 7. ADD_ALTERNATIVE creates/extends the primary's group; REMOVE empties it away.
{
  let t = base();
  t = templateReducer(t, { type: "ADD_ALTERNATIVE", primaryBlockId: "gov-id", altBlockId: "deed" });
  assert.deepEqual(t.alternatives[0]!.satisfiedBy, ["passport", "deed"]);
  t = templateReducer(t, { type: "ADD_ALTERNATIVE", primaryBlockId: "deed", altBlockId: "passport" });
  assert.equal(t.alternatives.length, 2, "new primary gets its own group");
  t = templateReducer(t, { type: "REMOVE_ALTERNATIVE", primaryBlockId: "deed", altBlockId: "passport" });
  assert.equal(t.alternatives.length, 1, "emptied group is dropped");
  assert.ok(!templateReducer(t, { type: "ADD_ALTERNATIVE", primaryBlockId: "gov-id", altBlockId: "gov-id" }).alternatives.some((g) => g.satisfiedBy.includes("gov-id")), "self-alternative rejected");
}

// 8. Inserting a saved section re-mints EVERY id inside (never impersonates pinned ids).
{
  let t = base();
  t = templateReducer(t, {
    type: "INSERT_SAVED_SECTION",
    section: base().sections[0]!, // same ids as existing sec-a
    atIndex: 2,
  });
  const inserted = t.sections[2]!;
  assert.notEqual(inserted.id, "sec-a");
  const ids = new Set<string>();
  for (const s of t.sections) {
    assert.ok(!ids.has(s.id)); ids.add(s.id);
    for (const ss of s.subsections) {
      assert.ok(!ids.has(ss.id)); ids.add(ss.id);
      for (const b of ss.blocks) { assert.ok(!ids.has(b.id), `dup id ${b.id}`); ids.add(b.id); }
    }
  }
}

// 9. Subsection cross-section move keeps contents intact.
{
  let t = base();
  t = templateReducer(t, {
    type: "MOVE_SUBSECTION", fromSectionId: "sec-a", toSectionId: "sec-b", fromIndex: 0, toIndex: 1,
  });
  assert.equal(t.sections[0]!.subsections.length, 1);
  assert.equal(t.sections[1]!.subsections.length, 2);
  assert.equal(t.sections[1]!.subsections[1]!.id, "sub-a1");
  assert.equal(t.sections[1]!.subsections[1]!.blocks.length, 2);
}

// 10. Permission + owner + expiry edits persist into state.
{
  let t = base();
  t = templateReducer(t, { type: "SET_PERMISSION", sectionId: "sec-b", role: "Applicant", field: "view", value: true });
  assert.equal(t.sections[1]!.permissions[0]!.view, true);
  t = templateReducer(t, { type: "SET_SECTION_OWNER", sectionId: "sec-b", owner: "Homium" });
  assert.equal(t.sections[1]!.owner, "Homium");
  t = templateReducer(t, { type: "UPDATE_BLOCK", blockId: "deed", patch: { expiry: { kind: "staleness", days: 90 }, criticality: "critical", sourcing: "scarce" } });
  const deed = t.sections[0]!.subsections[1]!.blocks[0]!;
  assert.deepEqual(deed.expiry, { kind: "staleness", days: 90 });
  assert.equal(deed.criticality, "critical");
  assert.equal(deed.sourcing, "scarce");
}

console.log("ALL 10 REDUCER TEST GROUPS PASS");

// 11. Leaving required_alt dissolves the block's alternative group (§3 invariant).
{
  let t = base();
  t = templateReducer(t, { type: "UPDATE_BLOCK", blockId: "gov-id", patch: { requirement: "required" } });
  assert.equal(t.alternatives.length, 0, "required_alt exit must dissolve the group");
}
console.log("required_alt invariant PASS");
