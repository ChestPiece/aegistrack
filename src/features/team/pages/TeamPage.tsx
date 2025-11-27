import { useState, useEffect } from "react";
import { userService, projectService } from "@/shared/services/api";
import { User, Project } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  UserPlus,
  X,
  Mail,
  Lock,
  Check,
  Ban,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/shared/contexts/AuthContext";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TableSkeleton } from "@/shared/components/skeletons/TableSkeleton";

export default function Team() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [resendingInvite, setResendingInvite] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);

  // Global User Management States
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    role: "member" as "admin" | "member",
    password: "",
  });
  const [passwordValidations, setPasswordValidations] = useState({
    length: false,
    number: false,
    special: false,
  });

  // Project Member Management States
  const [manageProjectOpen, setManageProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["users"],
    queryFn: userService.getAll,
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectService.getAll(),
  });

  useEffect(() => {
    setPasswordValidations({
      length: formData.password.length >= 8,
      number: /\d/.test(formData.password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    });
  }, [formData.password]);

  const isLoading = isLoadingMembers || isLoadingProjects;

  if (isLoading) {
    return <TableSkeleton />;
  }

  // --- Global User Management Handlers ---

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!passwordValidations.length || !passwordValidations.number) {
      toast.error(
        "Password must be at least 8 characters and contain a number"
      );
      return;
    }

    try {
      await userService.invite({
        email: formData.email,
        role: "member",
        fullName: formData.fullName,
        password: formData.password,
      });
      toast.success("Team member invited successfully");
      setIsCreateDialogOpen(false);
      setFormData({ email: "", fullName: "", role: "member", password: "" });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      toast.error((error as Error).message || "Failed to send invitation");
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await userService.update(selectedUser.id, {
        fullName: formData.fullName,
        role: formData.role,
      });
      toast.success("User updated successfully");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      toast.error((error as Error).message || "Failed to update user");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await userService.delete(selectedUser.id);
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      toast.error((error as Error).message || "Failed to delete user");
    }
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName || "",
      role: user.role || "member",
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleResendInvitation = async (userId: string) => {
    setResendingInvite(userId);
    try {
      await userService.resendInvitation(userId);
      toast.success("Invitation email resent successfully");
    } catch (error) {
      toast.error((error as Error).message || "Failed to resend invitation");
    } finally {
      setResendingInvite(null);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    currentStatus: boolean
  ) => {
    setTogglingStatus(userId);
    try {
      if (currentStatus) {
        await userService.disable(userId);
        toast.success("User account disabled");
      } else {
        await userService.enable(userId);
        toast.success("User account enabled");
      }
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    } catch (error) {
      toast.error((error as Error).message || "Failed to update user status");
    } finally {
      setTogglingStatus(null);
    }
  };

  // --- Project Member Management Handlers ---

  const openManageProjectDialog = (project: Project) => {
    setSelectedProject(project);
    setManageProjectOpen(true);
    setMemberSearchTerm("");
  };

  const handleAddMemberToProject = async (userId: string) => {
    if (!selectedProject) return;
    try {
      await projectService.addMembers(selectedProject.id, [userId]);
      toast.success("Member added to project");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] }); // Refresh to update local state
      // Update selectedProject local state to reflect change immediately for UI
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              members: [...(prev.members || []), userId],
            }
          : null
      );
    } catch (error) {
      toast.error("Failed to add member");
    }
  };

  const handleRemoveMemberFromProject = async (userId: string) => {
    if (!selectedProject) return;
    try {
      await projectService.removeMember(selectedProject.id, userId);
      toast.success("Member removed from project");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProject((prev) =>
        prev
          ? {
              ...prev,
              members: (prev.members || []).filter(
                (id: string) => id !== userId
              ),
            }
          : null
      );
    } catch (error) {
      toast.error("Failed to remove member");
    }
  };

  const getProjectMembers = (project: Project) => {
    if (!project || !project.members) return [];
    return members.filter((u) => project.members.includes(u.supabaseId));
  };

  const getAvailableMembersForProject = (project: Project) => {
    if (!project) return [];
    const projectMemberIds = project.members || [];
    return members
      .filter((u) => !projectMemberIds.includes(u.supabaseId))
      .filter(
        (u) =>
          u.fullName?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(memberSearchTerm.toLowerCase())
      );
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team & Projects</h1>
          <p className="text-muted-foreground">
            Manage team members and project assignments
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setFormData({
                  email: "",
                  fullName: "",
                  role: "member",
                  password: "",
                });
                setIsCreateDialogOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation email to a new team member.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  placeholder="colleague@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  required
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    placeholder="Create a secure password"
                    className="pl-9"
                  />
                </div>
              </div>
              {/* Password Strength Indicators */}
              {formData.password && (
                <div className="space-y-2 p-3 rounded-lg bg-muted/30 border border-white/5">
                  <p className="text-xs font-medium text-muted-foreground mb-1.5">
                    Password Requirements:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                          passwordValidations.length
                            ? "bg-green-500/20 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className="h-2 w-2" />
                      </div>
                      <span
                        className={
                          passwordValidations.length
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                          passwordValidations.number
                            ? "bg-green-500/20 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className="h-2 w-2" />
                      </div>
                      <span
                        className={
                          passwordValidations.number
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        Contains a number
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div
                        className={`h-3.5 w-3.5 rounded-full flex items-center justify-center ${
                          passwordValidations.special
                            ? "bg-green-500/20 text-green-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Check className="h-2 w-2" />
                      </div>
                      <span
                        className={
                          passwordValidations.special
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        Contains special character (optional)
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Send Invitation</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Project Teams
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const projectMembers = getProjectMembers(project);
            return (
              <Card key={project.id} className="glass flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openManageProjectDialog(project)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Manage
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {project.description || "No description"}
                  </p>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                      Members ({projectMembers.length})
                    </div>
                    <div className="space-y-2">
                      {projectMembers.slice(0, 5).map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {(member.fullName || member.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">
                            {member.fullName || member.email}
                          </span>
                        </div>
                      ))}
                      {projectMembers.length > 5 && (
                        <p className="text-xs text-muted-foreground pl-8">
                          +{projectMembers.length - 5} more
                        </p>
                      )}
                      {projectMembers.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">
                          No members assigned
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* All Members Section */}
      <div className="space-y-4 pt-8 border-t">
        <h2 className="text-xl font-semibold">All Team Members</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <Card
              key={member.id}
              className="glass hover:shadow-md transition-all"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {(member.fullName || member.email)
                          .charAt(0)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {member.fullName || "No Name"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        member.role === "admin" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {member.role}
                    </Badge>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="mb-3 flex gap-2">
                  {member.status === "pending" && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    >
                      Pending Activation
                    </Badge>
                  )}
                  {member.isActive === false && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-500/10 text-red-600 border-red-500/20"
                    >
                      Disabled
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 justify-end">
                  {member.status === "pending" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleResendInvitation(member.id)}
                      disabled={resendingInvite === member.id}
                    >
                      {resendingInvite === member.id ? (
                        <>
                          <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="h-3 w-3 mr-1" />
                          Resend Invite
                        </>
                      )}
                    </Button>
                  )}
                  {member.status === "active" &&
                    member.supabaseId !== currentUser?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 text-xs ${
                          member.isActive === false
                            ? "text-green-600 hover:text-green-600"
                            : "text-orange-600 hover:text-orange-600"
                        }`}
                        onClick={() =>
                          handleToggleUserStatus(
                            member.id,
                            member.isActive !== false
                          )
                        }
                        disabled={togglingStatus === member.id}
                      >
                        {togglingStatus === member.id ? (
                          <>
                            <div className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {member.isActive === false
                              ? "Enabling..."
                              : "Disabling..."}
                          </>
                        ) : (
                          <>
                            {member.isActive === false ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Enable
                              </>
                            ) : (
                              <>
                                <Ban className="h-3 w-3 mr-1" />
                                Disable
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(member)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => openDeleteDialog(member)}
                    disabled={member.supabaseId === currentUser?.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Manage Project Members Dialog */}
      <Dialog open={manageProjectOpen} onOpenChange={setManageProjectOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Project Team</DialogTitle>
            <DialogDescription>{selectedProject?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Members */}
            <div className="space-y-2">
              <Label>Current Members</Label>
              <ScrollArea className="h-40 border rounded-md p-2">
                <div className="space-y-1">
                  {getProjectMembers(selectedProject).map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px]">
                            {(member.fullName || member.email)
                              .charAt(0)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {member.fullName || member.email}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-destructive"
                        onClick={() =>
                          handleRemoveMemberFromProject(member.supabaseId)
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {getProjectMembers(selectedProject).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No members in this project
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Add Members */}
            <div className="space-y-2">
              <Label>Add Team Members</Label>
              <Input
                placeholder="Search members..."
                value={memberSearchTerm}
                onChange={(e) => setMemberSearchTerm(e.target.value)}
                className="h-8"
              />
              <ScrollArea className="h-40 border rounded-md p-2">
                <div className="space-y-1">
                  {getAvailableMembersForProject(selectedProject).map(
                    (member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md"
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[10px]">
                              {(member.fullName || member.email)
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">
                            {member.fullName || member.email}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() =>
                            handleAddMemberToProject(member.supabaseId)
                          }
                        >
                          Add
                        </Button>
                      </div>
                    )
                  )}
                  {getAvailableMembersForProject(selectedProject).length ===
                    0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {memberSearchTerm
                        ? "No matching members found"
                        : "All members added"}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name</Label>
              <Input
                id="edit-fullName"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "member") =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user "{selectedUser?.email}" from
              both the authentication system and database. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
