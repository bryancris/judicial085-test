import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { MessageSquare, BarChart3, Users, Upload, FileText, Scale, Plus, Layout } from "lucide-react";
import { tabColors, tabHoverColors } from "./ClientDetailTabs/tabStyles";

interface ClientDetailSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const sidebarItems = [
  { id: "client-intake", label: "Client Intake", icon: MessageSquare },
  { id: "case-analysis", label: "Case Analysis", icon: BarChart3 },
  { id: "discussion", label: "Case Discussion", icon: Users },
  { id: "discovery", label: "Discovery", icon: FileText },
  { id: "documents", label: "Document Hub", icon: Upload },
  { id: "contracts", label: "Contracts", icon: Scale },
  { id: "knowledge", label: "Create Document", icon: Plus },
  { id: "templates", label: "Placeholder", icon: Layout },
];

const ClientDetailSidebar: React.FC<ClientDetailSidebarProps> = ({ activeTab, onTabChange }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getItemClasses = (itemId: string) => {
    const isActive = activeTab === itemId;
    const baseColor = tabColors[itemId as keyof typeof tabColors] || "bg-gray-500 text-white";
    const hoverColor = tabHoverColors[itemId as keyof typeof tabHoverColors] || "hover:bg-accent hover:text-accent-foreground";
    return `${baseColor} ${hoverColor} ${isActive ? "ring-1 ring-primary/40" : "opacity-90"}`;
  };

  return (
    <Sidebar style={{ top: '6.5rem' }}>
      <SidebarContent>
        <SidebarMenu>
          {sidebarItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton
                onClick={() => onTabChange(item.id)}
                className={`${getItemClasses(item.id)} relative justify-center`}
                tooltip={isCollapsed ? item.label : undefined}
              >
                <item.icon className={isCollapsed ? "h-4 w-4" : "h-4 w-4 absolute left-3"} />
                {!isCollapsed && <span className="mx-auto">{item.label}</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default ClientDetailSidebar;