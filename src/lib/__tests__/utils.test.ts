import { describe, expect, it } from "vitest";
import { cn } from "~/lib/utils";

describe("cn", () => {
	it("returns empty string for no arguments", () => {
		expect(cn()).toBe("");
	});

	it("joins multiple class strings", () => {
		expect(cn("foo", "bar", "baz")).toBe("foo bar baz");
	});

	it("merges conflicting Tailwind classes (last wins)", () => {
		expect(cn("p-4", "p-8")).toBe("p-8");
		expect(cn("text-red-500", "text-blue-600")).toBe("text-blue-600");
	});

	it("drops falsy conditional classes", () => {
		expect(cn("base", false && "hidden", "visible")).toBe("base visible");
		expect(cn("base", undefined, null, "end")).toBe("base end");
	});

	it("includes truthy conditional classes", () => {
		expect(cn("base", true && "active")).toBe("base active");
	});

	it("handles object syntax", () => {
		expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
	});

	it("handles array syntax", () => {
		expect(cn(["one", "two"])).toBe("one two");
	});

	it("handles mixed input types", () => {
		expect(cn("a", ["b", "c"], { d: true, e: false })).toBe("a b c d");
	});
});
