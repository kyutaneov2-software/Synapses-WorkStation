export function todayStr(): string {
    return new Date().toISOString().split("T")[0];
}

export function tomorrowStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
}

export function isOverdue(plannedFor: string | null): boolean {
    if (!plannedFor) return false;
    return plannedFor < todayStr();
}

export function isToday(plannedFor: string | null): boolean {
    if (!plannedFor) return true;
    return plannedFor === todayStr();
}
