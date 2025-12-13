import { render, screen, fireEvent } from "@testing-library/react";
import { Layout } from "./Layout";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { LanguageId } from "@/types";


vi.mock("@/components/ui/sidebar", () => ({
  Sidebar: ({ children }: any) => <div data-testid="sidebar">{children}</div>,
  SidebarHeader: ({ children }: any) => <div>{children}</div>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: any) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <div>{children}</div>,
  SidebarMenuItem: ({ children }: any) => <div>{children}</div>,
  SidebarMenuButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  SidebarFooter: ({ children }: any) => <div>{children}</div>,
  SidebarProvider: ({ children }: any) => <div>{children}</div>,
  SidebarTrigger: () => <button>Trigger</button>,
  SidebarInset: ({ children }: any) => <div>{children}</div>,
  SidebarSeparator: () => <hr />,
  useSidebar: () => ({ setOpenMobile: vi.fn(), isMobile: false }),
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
}));

vi.mock("@/features/collection/components/AddCardModal", () => ({
  AddCardModal: ({ isOpen }: any) => isOpen ? <div>AddCardModal</div> : null,
}));
vi.mock("@/features/study/components/CramModal", () => ({
  CramModal: ({ isOpen }: any) => isOpen ? <div>CramModal</div> : null,
}));
vi.mock("@/features/settings/components/SettingsModal", () => ({
  SettingsModal: ({ isOpen }: any) => isOpen ? <div>SettingsModal</div> : null,
}));
vi.mock("@/components/ui/flags", () => ({
  PolishFlag: () => <span>PL</span>,
  NorwegianFlag: () => <span>NO</span>,
  JapaneseFlag: () => <span>JP</span>,
  SpanishFlag: () => <span>ES</span>,
  GermanFlag: () => <span>DE</span>,
}));


vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ signOut: vi.fn() }),
}));
vi.mock("@/features/profile/hooks/useProfile", () => ({
  useProfile: () => ({ profile: { username: "TestUser" } }),
}));
vi.mock("@/features/collection/hooks/useCardOperations", () => ({
  useCardOperations: () => ({ addCard: vi.fn() }),
}));
vi.mock("@/features/settings/hooks/useSyncthingSync", () => ({
  useSyncthingSync: () => ({
    saveToSyncFile: vi.fn(),
    loadFromSyncFile: vi.fn(),
    isSaving: false,
    isLoading: false,
  }),
}));

describe("Layout", () => {
  beforeEach(() => {
    useSettingsStore.setState({
      language: LanguageId.Polish,
      updateSettings: vi.fn(),
    });
  });

  it("should render children and sidebar", () => {
    render(
      <MemoryRouter>
        <Layout>
          <div>Main Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText("Main Content")).toBeInTheDocument();
    expect(screen.getByText("LinguaFlow")).toBeInTheDocument(); 
    expect(screen.getByText("Overview")).toBeInTheDocument();
  });

  it("should open AddCardModal when clicked", () => {
    render(
      <MemoryRouter>
        <Layout>Content</Layout>
      </MemoryRouter>
    );

    const addButton = screen.getByText("Add Entry");
    fireEvent.click(addButton);
    
    expect(screen.getByText("AddCardModal")).toBeInTheDocument();
  });

  it("should render different layout in study mode", () => {
    render(
      <MemoryRouter initialEntries={["/study"]}>
        <Layout>
          <div>Study Content</div>
        </Layout>
      </MemoryRouter>
    );

    expect(screen.getByText("Study Content")).toBeInTheDocument();
    
    
    
    expect(screen.queryByText("LinguaFlow")).not.toBeInTheDocument();
  });
});
