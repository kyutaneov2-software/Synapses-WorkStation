/**
 * Lightweight input validation for IPC handlers.
 * These throw errors that propagate to the renderer as rejected promises.
 */

export function requireString(
    value: unknown,
    name: string,
    max = 10000,
): string {
    if (typeof value !== "string") {
        throw new Error(
            `Invalid ${name}: expected string, got ${typeof value}`,
        );
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        throw new Error(`Invalid ${name}: cannot be empty`);
    }
    if (trimmed.length > max) {
        throw new Error(`Invalid ${name}: exceeds maximum length of ${max}`);
    }
    return trimmed;
}

export function optionalString(
    value: unknown,
    name: string,
    max = 10000,
): string | null {
    if (value === null || value === undefined || value === "") return null;
    return requireString(value, name, max);
}

export function requireNumber(value: unknown, name: string): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new Error(`Invalid ${name}: expected finite number`);
    }
    return value;
}

export function requirePositiveId(value: unknown, name: string): number {
    const n = requireNumber(value, name);
    if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`Invalid ${name}: expected positive integer`);
    }
    return n;
}

export function optionalId(value: unknown, name: string): number | null {
    if (value === null || value === undefined) return null;
    return requirePositiveId(value, name);
}

export function requireBoolean(value: unknown, name: string): boolean {
    if (typeof value !== "boolean") {
        throw new Error(`Invalid ${name}: expected boolean`);
    }
    return value;
}

export function requireEnum<T extends string>(
    value: unknown,
    name: string,
    allowed: readonly T[],
): T {
    if (typeof value !== "string" || !allowed.includes(value as T)) {
        throw new Error(
            `Invalid ${name}: expected one of ${allowed.join(", ")}`,
        );
    }
    return value as T;
}
