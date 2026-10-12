// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PwaControls } from "./PwaControls";

const originalServiceWorker = Object.getOwnPropertyDescriptor(navigator, "serviceWorker");
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  if (originalServiceWorker) Object.defineProperty(navigator, "serviceWorker", originalServiceWorker);
  else Reflect.deleteProperty(navigator, "serviceWorker");
});

function installEvent() {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(event, { prompt });
  fireEvent(window, event);
  return { event, prompt };
}

function serviceWorker(waiting: object | null = null, controller: object | null = {}) {
  vi.stubEnv("PROD", true);
  vi.spyOn(document, "readyState", "get").mockReturnValue("complete");
  const registration = Object.assign(new EventTarget(), {
    waiting, installing: null as EventTarget | null, update: vi.fn().mockResolvedValue(undefined),
  });
  const container = Object.assign(new EventTarget(), {
    controller, register: vi.fn().mockResolvedValue(registration),
  });
  Object.defineProperty(navigator, "serviceWorker", { configurable: true, value: container });
  return { container, registration };
}

describe("PWA controls", () => {
  it("does not offer an unavailable installation or update", () => {
    const { container } = render(<PwaControls />);
    expect(container).toBeEmptyDOMElement();
  });

  it("only opens the native install prompt after an explicit click and consumes it once", () => {
    render(<PwaControls />);
    const { event, prompt } = installEvent();
    expect(event.defaultPrevented).toBe(true);
    expect(prompt).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "安装应用" }));
    expect(prompt).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "安装应用" })).toBeNull();
  });

  it("removes installation controls when the browser reports a successful installation", () => {
    render(<PwaControls />);
    installEvent();
    fireEvent(window, new Event("appinstalled"));
    expect(screen.queryByRole("button", { name: "安装应用" })).toBeNull();
  });

  it("announces offline reading and clears that status on reconnection", () => {
    render(<PwaControls />);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    fireEvent(window, new Event("offline"));
    expect(screen.getByRole("status")).toHaveTextContent("显示上次缓存的内容");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    fireEvent(window, new Event("online"));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("registers inside the app base and only activates a waiting update after a click", async () => {
    const postMessage = vi.fn();
    const { container } = serviceWorker({ postMessage });
    render(<PwaControls />);
    const button = await screen.findByRole("button", { name: "更新应用" });
    expect(container.register).toHaveBeenCalledWith("/sw.js", { scope: "/", updateViaCache: "none" });
    expect(postMessage).not.toHaveBeenCalled();
    fireEvent.click(button);
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("does not treat the first installation as an application update", async () => {
    const { container } = serviceWorker({ postMessage: vi.fn() }, null);
    render(<PwaControls />);
    await waitFor(() => expect(container.register).toHaveBeenCalledOnce());
    expect(screen.queryByRole("button", { name: "更新应用" })).toBeNull();
  });

  it("observes a newly installed worker and detaches its listeners on unmount", async () => {
    const { registration } = serviceWorker();
    const { unmount } = render(<PwaControls />);
    await act(async () => undefined);
    const worker = new EventTarget();
    const removeListener = vi.spyOn(worker, "removeEventListener");
    act(() => {
      registration.installing = worker;
      registration.dispatchEvent(new Event("updatefound"));
      registration.waiting = { postMessage: vi.fn() };
      worker.dispatchEvent(new Event("statechange"));
    });
    expect(await screen.findByRole("button", { name: "更新应用" })).toBeInTheDocument();
    unmount();
    expect(removeListener).toHaveBeenCalledWith("statechange", expect.any(Function));
  });
});
