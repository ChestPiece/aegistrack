import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { notificationService } from "@/services/api";
import { Notification } from "@/types";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAll();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        await notificationService.markAsRead(notification.id);
        fetchNotifications();
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
    // Navigate based on notification type/content if needed
    // For now, just go to notifications page
    navigate("/notifications");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "flex flex-col items-start gap-1 p-3 cursor-pointer",
                !notification.read && "bg-muted/50"
              )}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="font-medium text-sm">{notification.title}</div>
              <div className="text-xs text-muted-foreground line-clamp-2">
                {notification.message}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {new Date(notification.createdAt).toLocaleDateString()}
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuItem
          className="p-2 text-center text-sm font-medium text-primary justify-center cursor-pointer border-t"
          onClick={() => navigate("/notifications")}
        >
          View all notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
