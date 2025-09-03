import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX
} from "lucide-react";
import { UserData, UserRole, AgencyData, CreateUserData, CreateAgencyData } from "@/types/auth";

// Safely convert Firestore Timestamp or Date-like values to Date
const toDateSafely = (value: any): Date => {
  if (!value) return new Date(0);
  if (typeof value?.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value);
};

const AdminDashboard = () => {
  const { user, createUser, createAgency, getUsersByAgency, getAllUsers, getAgencies, updateUser, deleteUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'agencies'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [showCreateAgencyFromUser, setShowCreateAgencyFromUser] = useState(false);
  const [agencyUserCounts, setAgencyUserCounts] = useState<Record<string, number>>({});
  const [openAgencyUsersFor, setOpenAgencyUsersFor] = useState<string | null>(null);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [resetStatus, setResetStatus] = useState<string>("");

  // Create User form state
  const [userForm, setUserForm] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
    agencyId: '',
    agencyIds: [],
  });
  const [createUserError, setCreateUserError] = useState<string>('');

  const [agencyForm, setAgencyForm] = useState<CreateAgencyData>({
    name: '',
    adminId: user?.uid || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  // When opening Create User, prefill restrictions for agency creators
  useEffect(() => {
    if (showCreateUser && user?.role === 'agency') {
      setUserForm(prev => ({
        ...prev,
        role: 'user',
        agencyId: user.agencyId || '',
      }));
    }
  }, [showCreateUser, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agenciesData, allUsers] = await Promise.all([
        getAgencies(),
        getAllUsers(),
      ]);
      setAgencies(agenciesData || []);
      setUsers(allUsers || []);

      // Derive accurate user counts per agency from fresh user list
      const counts: Record<string, number> = {};
      (allUsers || []).forEach((u) => {
        const aId = (u as any).agencyId;
        if (aId) counts[aId] = (counts[aId] || 0) + 1;
      });
      setAgencyUserCounts(counts);
    } catch (error) {
      console.error('Failed to load data:', error);
      setAgencies([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError('');
    
    try {
      // Enforce agency assignment requirement for non-admin users
      if (userForm.role !== 'admin' && userForm.role !== 'manager' && !userForm.agencyId) {
        setCreateUserError('Please select an agency for the new user.');
        return;
      }

      // Enforce agency assignment requirement for managers
      if (userForm.role === 'manager' && (!userForm.agencyIds || userForm.agencyIds.length === 0)) {
        setCreateUserError('Please select at least one agency for the manager.');
        return;
      }

      // Enforce agency user constraints: force role=user and agencyId to creator's agency
      const payload: CreateUserData = user?.role === 'agency'
        ? {
            email: userForm.email,
            password: userForm.password,
            displayName: userForm.displayName,
            role: 'user',
            agencyId: user.agencyId || '',
          }
        : userForm;

      await createUser(payload);
      setUserForm({
        email: '',
        password: '',
        displayName: '',
        role: 'user',
        agencyId: '',
        agencyIds: [],
      });
      setShowCreateUser(false);
      loadData();
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setCreateUserError(error?.message || 'Failed to create user');
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createAgency(agencyForm);
      setAgencyForm({
        name: '',
        adminId: user?.uid || '',
      });
      setShowCreateAgency(false);
      loadData();
    } catch (error) {
      console.error('Failed to create agency:', error);
    }
  };

  const handleCreateAgencyFromUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newAgency = await createAgency(agencyForm);
      setAgencyForm({
        name: '',
        adminId: user?.uid || '',
      });
      setShowCreateAgencyFromUser(false);
      // Reload agencies to update the dropdown
      const agenciesData = await getAgencies();
      setAgencies(agenciesData || []);
      // Auto-select the newly created agency
      if (newAgency?.id) {
        setUserForm(prev => ({ ...prev, agencyId: newAgency.id }));
      }
    } catch (error) {
      console.error('Failed to create agency:', error);
    }
  };

  const openEditUser = (u: UserData) => {
    setEditingUser(u);
    setEditForm({
      displayName: u.displayName,
      role: u.role,
      agencyId: u.agencyId,
      isActive: u.isActive,
    });
  };

  const submitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateUser(editingUser.uid, {
        displayName: editForm.displayName || editingUser.displayName,
        role: (editForm.role as UserRole) || editingUser.role,
        agencyId: editForm.agencyId,
        isActive: editForm.isActive ?? editingUser.isActive,
      });
      setEditingUser(null);
      setEditForm({});
      loadData();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgencies = agencies.filter(agency =>
    (agency.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-300">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
            <p className="text-neutral-600 mt-2">Manage users and agencies</p>
          </div>
          <Button asChild variant="outline" className="focus-ring">
            <Link to="/">← Back to landing</Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-brand-red-600 mr-4" />
              <div>
                <p className="text-sm text-neutral-600">Total Users</p>
                <p className="text-2xl font-bold text-neutral-900">{users.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-accent-teal mr-4" />
              <div>
                <p className="text-sm text-neutral-600">Total Agencies</p>
                <p className="text-2xl font-bold text-neutral-900">{agencies.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center">
              <UserPlus className="h-8 w-8 text-brand-red-600 mr-4" />
              <div>
                <p className="text-sm text-neutral-600">Active Users</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-brand-red-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('agencies')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'agencies'
                ? 'bg-brand-red-600 text-white'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Agencies
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          {activeTab === 'users' ? (
            <Button
              onClick={() => setShowCreateUser(true)}
              className="btn-primary"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </Button>
          ) : (
            <Button
              onClick={() => setShowCreateAgency(true)}
              className="btn-primary"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Create Agency
            </Button>
          )}
        </div>

        {/* Content */}
        {activeTab === 'users' ? (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.uid} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{user.displayName}</h3>
                    <p className="text-neutral-600">{user.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'agency' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}>
                        {user.role}
                      </span>
                      {user.agencyName && (
                        <span className="text-xs text-neutral-500">{user.agencyName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEditUser(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-error hover:text-error"
                          disabled={user.uid === (auth.currentUser?.uid || '')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {user.displayName}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action permanently removes the user record. This cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={async () => {
                              if (user.uid === (auth.currentUser?.uid || '')) return;
                              try {
                                await deleteUser(user.uid);
                                await loadData();
                              } catch (err: any) {
                                console.error(err);
                              }
                            }}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAgencies.map((agency) => (
              <Card key={agency.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{agency.name}</h3>
                    {(() => {
                      const count = users.filter(u => u.agencyId === agency.id).length;
                      const label = `${count} ${count === 1 ? 'user' : 'users'}`;
                      return (
                        <button
                          type="button"
                          className="text-neutral-600 underline-offset-2 hover:underline focus:outline-none"
                          onClick={() => setOpenAgencyUsersFor(agency.id)}
                        >
                          {label}
                        </button>
                      );
                    })()}
                    <p className="text-xs text-neutral-500">
                      Created: {toDateSafely(agency.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="text-error hover:text-error">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
            {filteredAgencies.length === 0 && (
              <Card className="p-6">
                <p className="text-neutral-600">No agencies yet. Create one to get started.</p>
              </Card>
            )}
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New User</h2>
              {createUserError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{createUserError}</p>
                </div>
              )}
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Full Name</Label>
                  <Input
                    id="displayName"
                    value={userForm.displayName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, displayName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                {user?.role === 'agency' ? (
                  <div className="text-sm text-neutral-600">
                    This user will be assigned to your agency automatically.
                  </div>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select
                        value={userForm.role}
                        onValueChange={(value: UserRole) => setUserForm(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="agency">Agency</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="agencyId">
                          {userForm.role === 'manager' ? 'Assign Agencies' : 'Assign Agency'} 
                          {userForm.role !== 'admin' ? '*' : '(optional)'}
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateAgencyFromUser(true)}
                          className="text-xs"
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          Add Agency
                        </Button>
                      </div>
                      {userForm.role === 'manager' ? (
                        <div className="space-y-2">
                          <Select
                            value=""
                            onValueChange={(value: string) => {
                              if (value && value !== 'none') {
                                const currentAgencies = userForm.agencyIds || [];
                                if (!currentAgencies.includes(value)) {
                                  setUserForm(prev => ({ 
                                    ...prev, 
                                    agencyIds: [...currentAgencies, value] 
                                  }));
                                }
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select agencies to assign" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select an agency</SelectItem>
                              {agencies.map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {userForm.agencyIds && userForm.agencyIds.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {userForm.agencyIds.map((agencyId) => {
                                const agency = agencies.find(a => a.id === agencyId);
                                return (
                                  <Badge 
                                    key={agencyId} 
                                    variant="secondary"
                                    className="flex items-center space-x-1"
                                  >
                                    <span>{agency?.name || agencyId}</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUserForm(prev => ({
                                          ...prev,
                                          agencyIds: prev.agencyIds?.filter(id => id !== agencyId) || []
                                        }));
                                      }}
                                      className="ml-1 text-neutral-500 hover:text-neutral-700"
                                    >
                                      ×
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Select
                          value={userForm.agencyId || 'none'}
                          onValueChange={(value: string) => setUserForm(prev => ({ ...prev, agencyId: value === 'none' ? '' : value }))}
                          required={userForm.role !== 'admin'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an agency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {agencies.map((a) => (
                              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </>
                )}
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Create User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateUser(false);
                      setCreateUserError('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Agency Users Modal */}
        <Dialog open={!!openAgencyUsersFor} onOpenChange={(v) => !v && setOpenAgencyUsersFor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agency Users</DialogTitle>
              <DialogDescription>
                List of users assigned to this agency.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {users.filter(u => u.agencyId === openAgencyUsersFor).length === 0 ? (
                <p className="text-neutral-600 text-sm">No users in this agency yet.</p>
              ) : (
                users
                  .filter(u => u.agencyId === openAgencyUsersFor)
                  .map(u => (
                    <div key={u.uid} className="flex items-center justify-between rounded-md border border-neutral-200 p-2">
                      <div>
                        <p className="font-medium text-neutral-900">{u.displayName}</p>
                        <p className="text-neutral-600 text-sm">{u.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-brand-red-600 text-white' :
                        u.role === 'agency' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}>
                        {u.role}
                      </span>
                    </div>
                  ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenAgencyUsersFor(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Edit User</h2>
              <form onSubmit={submitEditUser} className="space-y-4">
                <div>
                  <Label htmlFor="editName">Full Name</Label>
                  <Input
                    id="editName"
                    value={editForm.displayName || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editRole">Role</Label>
                  <Select
                    value={(editForm.role as UserRole) || editingUser.role}
                    onValueChange={(value: UserRole) => setEditForm(prev => ({ ...prev, role: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="agency">Agency</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editAgency">Agency</Label>
                  <Select
                    value={(editForm.agencyId ?? editingUser.agencyId) ?? 'none'}
                    onValueChange={(value: string) =>
                      setEditForm(prev => ({ ...prev, agencyId: value === 'none' ? undefined : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an agency (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {agencies.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editingUser.email} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="editActive">Account Status</Label>
                    <div className="mt-2">
                      <button
                        type="button"
                        className={`relative inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                          editForm.isActive ?? editingUser.isActive 
                            ? 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200 hover:border-green-400 shadow-sm' 
                            : 'bg-red-100 text-red-800 border-2 border-red-300 hover:bg-red-200 hover:border-red-400 shadow-sm'
                        }`}
                        onClick={() => setEditForm(prev => ({ ...prev, isActive: !(prev.isActive ?? editingUser.isActive) }))}
                        title={`Click to ${(editForm.isActive ?? editingUser.isActive) ? 'deactivate' : 'activate'} user account`}
                      >
                        {(editForm.isActive ?? editingUser.isActive) ? (
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2 text-red-600" />
                        )}
                        <span className="font-semibold">
                          {(editForm.isActive ?? editingUser.isActive) ? 'Active' : 'Inactive'}
                        </span>
                        <div className={`ml-2 w-4 h-4 rounded-full border-2 ${
                          editForm.isActive ?? editingUser.isActive 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-red-500 bg-red-500'
                        }`}>
                          <div className="w-1.5 h-1.5 rounded-full mx-auto mt-0.5 bg-white"></div>
                        </div>
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {(editForm.isActive ?? editingUser.isActive) 
                        ? 'User can log in and access the system' 
                        : 'User account is disabled and cannot log in'
                      }
                    </p>
                  </div>
                  <div className="mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        try {
                          setResetStatus("Sending...");
                          await sendPasswordResetEmail(auth, editingUser.email);
                          setResetStatus("Password reset email sent.");
                        } catch (err: any) {
                          setResetStatus(err?.message || "Failed to send reset email");
                        }
                      }}
                    >
                      Send Password Reset
                    </Button>
                    {resetStatus && (
                      <p className="text-xs text-neutral-600 mt-2">{resetStatus}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingUser(null); setEditForm({}); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Create Agency Modal */}
        {showCreateAgency && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New Agency</h2>
              <form onSubmit={handleCreateAgency} className="space-y-4">
                <div>
                  <Label htmlFor="agencyName">Agency Name</Label>
                  <Input
                    id="agencyName"
                    value={agencyForm.name}
                    onChange={(e) => setAgencyForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Create Agency
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateAgency(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Create Agency Modal (from User Creation) */}
        {showCreateAgencyFromUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New Agency</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Create a new agency to assign to the user you're creating.
              </p>
              <form onSubmit={handleCreateAgencyFromUser} className="space-y-4">
                <div>
                  <Label htmlFor="agencyNameFromUser">Agency Name</Label>
                  <Input
                    id="agencyNameFromUser"
                    value={agencyForm.name}
                    onChange={(e) => setAgencyForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Create Agency
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateAgencyFromUser(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
