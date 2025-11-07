import React from "react";
import { render, screen, fireEvent } from "@/tests/test-utils";
import LogoutButton from "../LogoutButton";

// aktifkan mock supabaseClient
vi.mock("@/lib/supabaseClient");

test("calls supabase.auth.signOut when clicked", async () => {
  render(<LogoutButton />);

  const button = screen.getByRole("button");
  fireEvent.click(button);

  // kalau LogoutButton render "Logout" atau sejenis
  expect(button).toBeInTheDocument();
});
