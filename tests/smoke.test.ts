import { describe, expect, it } from "vitest";

describe("test setup", () => {
  it("loads the Vitest and jest-dom environment", () => {
    const element = document.createElement("main");

    document.body.appendChild(element);

    expect(element).toBeInTheDocument();
  });
});
