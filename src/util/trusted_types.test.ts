import {describe, test, expect, afterEach, vi} from 'vitest';

describe('Trusted Types', () => {
    const originalWorker = (globalThis as any).Worker;

    afterEach(() => {
        (globalThis as any).Worker = originalWorker;
        vi.unstubAllGlobals();
        vi.resetModules();
    });

    test('creates the worker and parses attribution markup through the maplibre-gl policy', async () => {
        const policy = {createHTML: vi.fn(trusted), createScriptURL: vi.fn(trusted)};
        const createPolicy = vi.fn((_name: string, _rules: unknown) => policy);
        vi.stubGlobal('trustedTypes', {createPolicy});
        const WorkerSpy = vi.fn();
        (globalThis as any).Worker = WorkerSpy;
        const {DOM} = await import('./dom.ts');
        const {workerFactory} = await import('./web_worker.ts');
        const {config} = await import('./config.ts');
        config.WORKER_URL = '/worker.cjs';

        expect(DOM.sanitize('<b>bold</b>').textContent).toBe('bold');
        await workerFactory();

        expect(createPolicy).toHaveBeenCalledTimes(1);
        expect(createPolicy.mock.calls[0][0]).toBe('maplibre-gl');
        expect(policy.createHTML).toHaveBeenCalledWith('<b>bold</b>');
        expect(WorkerSpy.mock.calls[0][0]).toBe(policy.createScriptURL.mock.results[0].value);
    });

    test('passes plain strings when the page does not allow the policy', async () => {
        vi.stubGlobal('trustedTypes', {createPolicy: () => { throw new TypeError('Policy "maplibre-gl" disallowed.'); }});
        const WorkerSpy = vi.fn();
        (globalThis as any).Worker = WorkerSpy;
        const {DOM} = await import('./dom.ts');
        const {workerFactory} = await import('./web_worker.ts');
        const {config} = await import('./config.ts');
        config.WORKER_URL = '/worker.cjs';

        expect(DOM.sanitize('<b>bold</b>').textContent).toBe('bold');
        await workerFactory();

        expect(WorkerSpy.mock.calls[0]).toEqual(['/worker.cjs']);
    });
});

/** Stands in for a `TrustedHTML` or `TrustedScriptURL`, which stringify to the value they were created from. */
function trusted(input: string): {toString(): string} {
    return {toString: () => input};
}
