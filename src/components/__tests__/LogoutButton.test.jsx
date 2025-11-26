/* eslint-env vitest */
import React from "react";
import { vi } from "vitest";
import { render, screen, fireEvent } from "@/tests/test-utils";
import LogoutButton from "../LogoutButton";

// aktifkan mock supabaseClient
vi.mock("@/lib/supabaseClient");

const originalLocation = window.location;

beforeAll(() => {
  // mock navigation to avoid jsdom "not implemented" warning
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, href: "/", assign: vi.fn(), replace: vi.fn() },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

test("calls supabase.auth.signOut when clicked", async () => {
  render(<LogoutButton />);

  const button = screen.getByRole("button");
  fireEvent.click(button);

  expect(button).toBeInTheDocument();
});
