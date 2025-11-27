import { useLocation } from "react-router-dom";
import { NavLink } from "@/shared/components/common/NavLink";
import { useAuth } from "@/shared/contexts/AuthContext";
import { ThemeToggle } from "@/shared/components/common/ThemeToggle";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  Bell,
  User,
  LogOut,
  ChevronRight,
  Archive,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarFooter,
} from "@/shared/components/ui/sidebar";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, userRole, userData, signOut } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const adminItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
    { title: "Projects", url: "/admin/projects", icon: FolderKanban },
    { title: "Tasks", url: "/admin/tasks", icon: CheckSquare },
    { title: "Team", url: "/admin/team", icon: Users },
    { title: "Archived", url: "/admin/archived", icon: Archive },
  ];

  const userItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Tasks", url: "/tasks", icon: CheckSquare },
    { title: "Projects", url: "/projects", icon: FolderKanban },
  ];

  const commonItems = [
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const menuItems = userRole === "admin" ? adminItems : userItems;

  return (
    <Sidebar
      className={
        collapsed
          ? "w-16 border-r border-sidebar-border"
          : "w-64 border-r border-sidebar-border"
      }
    >
      <SidebarContent className="bg-sidebar">
        <div className="px-3 py-4">
          <h2
            className={`font-bold text-xl tracking-tight text-foreground ${
              collapsed ? "text-center" : ""
            }`}
          >
            {collapsed ? "AT" : "AegisTrack"}
          </h2>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/80">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-muted-foreground/80">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {commonItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="bg-sidebar border-t border-sidebar-border">
        <div className="p-3">
          <div
            className={`flex items-center gap-3 ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <Avatar className="h-8 w-8 ring-2 ring-border">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userData?.fullName?.charAt(0).toUpperCase() ||
                  user?.email?.charAt(0).toUpperCase() ||
                  "U"}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {userData?.fullName || user?.email || "User"}
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">
                  {userRole}
                </p>
              </div>
            )}
          </div>
          <ThemeToggle collapsed={collapsed} />
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className={`mt-2 hover:bg-red-500/10 hover:text-red-500 ${
              collapsed ? "" : "w-full"
            }`}
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign out</span>}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
