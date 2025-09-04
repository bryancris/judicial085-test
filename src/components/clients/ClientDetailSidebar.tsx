import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { MessageSquare, BarChart3, Users, Upload, FileText, Scale, Plus, Layout } from "lucide-react";
import { tabColors } from "./ClientDetailTabs/tabStyles";

interface ClientDetailSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

const sidebarItems = [
  {
    group: "Case Management",
    items: [
      { id: "client-intake", label: "Client Intake", icon: MessageSquare },
      { id: "case-analysis", label: "Case Analysis", icon: BarChart3 },
      { id: "case-discussion", label: "Case Discussion", icon: Users },
      { id: "discovery", label: "Discovery", icon: FileText },
    ]
  },
  {
    group: "Documents & Contracts",
    items: [
      { id: "documents", label: "Document Hub", icon: Upload },
      { id: "contracts", label: "Contracts", icon: Scale },
    ]
  },
  {
    group: "Tools",
    items: [
      { id: "knowledge", label: "Create Document", icon: Plus },
      { id: "templates", label: "Placeholder", icon: Layout },
    ]
  }
];

const ClientDetailSidebar: React.FC<ClientDetailSidebarProps> = ({ activeTab, onTabChange }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  const getItemClasses = (itemId: string) => {
    const isActive = activeTab === itemId;
    const baseColor = tabColors[itemId as keyof typeof tabColors] || "bg-gray-500 text-white";
    
    if (isActive) {
      return `${baseColor} hover:opacity-90`;
    }
    return "hover:bg-accent hover:text-accent-foreground";
  };

  return (
    <Sidebar>
      <SidebarContent>
        {sidebarItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel className="text-sm font-medium text-muted-foreground">
              {!isCollapsed && group.group}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.id)}
                      className={getItemClasses(item.id)}
                      tooltip={isCollapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
};

export default ClientDetailSidebar;