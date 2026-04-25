import { useEffect, useState } from "react";
import { AdminDashboardLayout } from "@/components/dashboard/AdminDashboardLayout";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { Users, Search, Filter, Loader2, UserPlus, Edit, Trash2, Shield, Ban } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getAdminUsers, deleteUser } from "@/services/api";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  last_login?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
  const [showDeletedUsers, setShowDeletedUsers] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Safe extraction
        const response: any = await getAdminUsers({ page: currentPage, limit: 50 });

        const usersData =
          Array.isArray(response) ? response :
            Array.isArray(response?.data) ? response.data :
              Array.isArray(response?.data?.users) ? response.data.users :
                Array.isArray(response?.data?.data) ? response.data.data :
                  [];

        setUsers(usersData);
        setTotalUsers(usersData.length);
      } catch (err) {
        console.error("API ERROR:", err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500 text-white';
      case 'moderator': return 'bg-orange-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const getStatusBadgeColor = (status?: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'inactive': return 'bg-gray-500 text-white';
      case 'suspended': return 'bg-red-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const toggleUser = (id: string) => {
    setExpandedUserId(prev => (prev === id ? null : id));
  };

  const handleEditUser = (user: User) => {
    console.log("Edit user:", user);
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const userToDelete = users.find(u => u._id === id);
      await deleteUser(id);
      
      if (userToDelete) {
        setDeletedUsers(prev => [...prev, userToDelete]);
      }
      
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // Step 2: Local filtering
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminDashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground text-sm mt-1">Manage user accounts and permissions</p>
          </div>
          <Button
            className="flex items-center gap-2 cursor-pointer hover:bg-primary/90 transition"
            onClick={() => setShowAddModal(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <DashboardCard title="Total Users" icon={<Users className="h-5 w-5 text-blue-500" />}>
            <div className="text-2xl font-bold">{totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Registered accounts</p>
          </DashboardCard>

          <DashboardCard title="Active Users" icon={<Shield className="h-5 w-5 text-green-500" />}>
            <div className="text-2xl font-bold">
              {users.filter(u => u.status === 'active' || !u.status).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </DashboardCard>

          <DashboardCard title="Admins" icon={<Users className="h-5 w-5 text-red-500" />}>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Administrators</p>
          </DashboardCard>

          <DashboardCard 
            title="Deleted" 
            icon={<Ban className="h-5 w-5 text-orange-500" />}
            className="cursor-pointer hover:shadow-md transition"
            onClick={() => setShowDeletedUsers(prev => !prev)}
          >
            <div className="text-2xl font-bold">
              {deletedUsers.length}
            </div>
            <p className="text-xs text-muted-foreground">Deleted this session</p>
          </DashboardCard>
        </div>

        {/* Filters */}
        <DashboardCard title="Filters" icon={<Filter className="h-5 w-5 text-primary" />}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
                <button
                  onClick={() => setSearch(search)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs border rounded hover:bg-muted transition"
                >
                  Apply
                </button>
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DashboardCard>

        {/* Users Table */}
        <DashboardCard title="Users" icon={<Users className="h-5 w-5 text-primary" />}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading users...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium">User</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Joined</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <>
                      <tr
                        key={user._id}
                        className="border-b border-border hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleUser(user._id)}
                      >
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getRoleBadgeColor(user.role)}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusBadgeColor(user.status)}>
                            {user.status || 'active'}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleUser(user._id);
                              }}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditUser(user);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(user._id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedUserId === user._id && (
                        <tr className="bg-muted/10">
                          <td colSpan={6} className="p-0">
                            <div className="p-4 bg-muted/20 border-x border-b animate-in fade-in slide-in-from-top-1 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Full Name:</strong> {user.name}</p>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Email:</strong> {user.email}</p>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">User ID:</strong> {user._id}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Role:</strong> {user.role}</p>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Status:</strong> {user.status || 'active'}</p>
                                  <p className="text-sm"><strong className="text-muted-foreground mr-2">Joined:</strong> {user.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  Showing {users.length} of {totalUsers} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {currentPage}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={users.length < 10}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DashboardCard>

        {showDeletedUsers && (
          <div className="mt-4 border p-4 rounded bg-muted/20 animate-in fade-in duration-300">
            <h3 className="font-semibold mb-2">Deleted Users</h3>
            {deletedUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No deleted users</p>
            ) : (
              <div className="space-y-2">
                {deletedUsers.map(user => (
                  <div key={user._id} className="border-b border-border py-2 text-sm flex justify-between">
                    <span>{user.name} - {user.email}</span>
                    <Badge variant="outline" className="text-[10px]">Deleted</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg w-96 shadow-xl border animate-in zoom-in-95 duration-200">
            <h2 className="text-lg font-semibold mb-4">Add User</h2>
            <div className="space-y-4">
              <input
                placeholder="Name"
                className="border p-2 w-full rounded bg-background"
              />
              <input
                placeholder="Email"
                className="border p-2 w-full rounded bg-background"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 border rounded hover:bg-muted transition text-sm"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition text-sm"
                onClick={() => {
                  console.log("Add user clicked");
                  setShowAddModal(false);
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};

export default AdminUsersPage;
