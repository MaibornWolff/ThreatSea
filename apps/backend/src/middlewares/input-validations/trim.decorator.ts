import { Transform } from "class-transformer";

export function Trim() {
    return Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value));
}
