import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFilterDraft, updateFilterDraft, clearFilterDraft, applyFilterDraft, filterSelectionCount } from '../src/lib/filterDraft';
import { readFilterValues, archiveFilterKeys } from '../src/lib/archiveFilters';
test('draft edits are independent, preserve multi-select alternatives and leave applied URL unchanged until Apply', () => {
    const applied = new URLSearchParams('group=social&tool=claude&q=store&sort=usage&page=3');
    const original = applied.toString();
    let draft = updateFilterDraft(applied, 'group', current => [...current, 'visual']);
    draft = updateFilterDraft(draft, 'tool', current => [...current, 'gemini']);
    draft = updateFilterDraft(draft, 'outputFormat', ['text', 'image']);
    assert.equal(applied.toString(), original);
    assert.deepEqual(readFilterValues(draft, 'group'), ['social', 'visual']);
    assert.deepEqual(readFilterValues(draft, 'tool'), ['claude', 'gemini']);
    assert.deepEqual(readFilterValues(draft, 'outputFormat'), ['text', 'image']);
    assert.equal(draft.get('q'), 'store');
    assert.equal(draft.get('sort'), 'usage');
    assert.equal(draft.has('page'), false);
    const committed = applyFilterDraft(draft);
    assert.notEqual(committed, draft);
    assert.equal(committed.toString(), draft.toString());
    assert.equal(applied.toString(), original);
});
test('all option facets retain multiple selections and round-trip through a shareable URL', () => {
    let draft = new URLSearchParams('q=test');
    for (const key of archiveFilterKeys) {
        const values = key === 'referenceImage' ? ['required'] : key === 'group' ? ['social', 'visual'] : ['first', 'second'];
        draft = updateFilterDraft(draft, key, values);
    }
    const restored = new URLSearchParams(applyFilterDraft(draft).toString());
    for (const key of archiveFilterKeys)
        assert.deepEqual(readFilterValues(restored, key), key === 'referenceImage' ? ['required'] : key === 'group' ? ['social', 'visual'] : ['first', 'second']);
    assert.equal(filterSelectionCount(restored), archiveFilterKeys.length * 2 - 1);
});
test('group changes remove only out-of-group use cases, preserving other facets and the query', () => {
    const start = new URLSearchParams('group=visual&group=business&useCase=vis-09&useCase=product-image&tool=gemini&outputFormat=image&q=photo');
    const draft = updateFilterDraft(start, 'group', ['visual']);
    assert.deepEqual(readFilterValues(draft, 'useCase'), ['vis-09']);
    assert.deepEqual(readFilterValues(draft, 'tool'), ['gemini']);
    assert.equal(draft.get('q'), 'photo');
    assert.equal(start.getAll('useCase').length, 2);
});
test('clear resets only modal facets; search and sort remain, while canceled draft never mutates the original', () => {
    const applied = new URLSearchParams('group=visual&tool=gemini&tool=claude&q=photo&sort=usage&page=2');
    const cleared = clearFilterDraft(applied);
    assert.equal(filterSelectionCount(cleared), 0);
    assert.equal(cleared.get('q'), 'photo');
    assert.equal(cleared.get('sort'), 'usage');
    assert.equal(cleared.has('page'), false);
    assert.equal(filterSelectionCount(applied), 3);
    assert.equal(applied.get('page'), '2');
});
test('legacy group links expand inside the draft without rewriting the applied address on cancel', () => {
    const url = new URLSearchParams('group=design&group=content&q=photo');
    const draft = createFilterDraft(url);
    assert.deepEqual(readFilterValues(draft, 'group'), ['visual', 'ux', 'publishing']);
    const removed = updateFilterDraft(draft, 'group', values => values.filter(x => x !== 'visual'));
    assert.deepEqual(readFilterValues(removed, 'group'), ['ux', 'publishing']);
    assert.equal(url.toString(), 'group=design&group=content&q=photo');
});
