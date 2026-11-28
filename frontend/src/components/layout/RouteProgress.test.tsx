import { useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ROUTE_PROGRESS_MS, RouteProgress } from "./RouteProgress";

const nav: { go?: (to: string) => void } = {};
function Nav() {
  const go = useNavigate();
  useEffect(() => void (nav.go = go), [go]);
  return null;
}

describe("RouteProgress", () => {
  afterEach(() => vi.useRealTimers());

  it("CA3: aparece ao trocar de rota e some depois", () => {
    vi.useFakeTimers();
    render(<MemoryRouter><Nav /><RouteProgress /></MemoryRouter>);
    expect(screen.queryByRole("progressbar")).toBeNull();
    act(() => nav.go!("/outra"));
    expect(screen.getByRole("progressbar", { name: "Carregando a tela" })).toBeInTheDocument();
    act(() => void vi.advanceTimersByTime(ROUTE_PROGRESS_MS + 1));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });
});
