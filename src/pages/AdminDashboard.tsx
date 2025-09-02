import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  BuildingPlus,
  Search,
  Filter
} from "lucide-react";
import { UserData, UserRole, AgencyData, CreateUserData, CreateAgencyData } from "@/types/auth";

const AdminDashboard = () => {
  const { user, createUser, createAgency, getUsersByAgency, getAgencies, updateUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [agencies, setAgencies] = useState<AgencyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'agencies'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateAgency, setShowCreateAgency] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    role: 'user',
    agencyId: '',
  });

  const [agencyForm, setAgencyForm] = useState<CreateAgencyData>({
    name: '',
    adminId: user?.uid || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [agenciesData, allUsers] = await Promise.all([
        getAgencies(),
        getUsersByAgency(''), // Get all users
      ]);
      setAgencies(agenciesData);
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(userForm);
      setUserForm({
        email: '',
        password: '',
        displayName: '',
        role: 'user',
        agencyId: '',
      });
      setShowCreateUser(false);
      loadData();
    } catch (error) {
      console.error('Failed to create user:', error);
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

  const filteredUsers = users.filter(user =>
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgencies = agencies.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-neutral-900">Admin Dashboard</h1>
          <p className="text-neutral-600 mt-2">Manage users and agencies</p>
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

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            onClick={() => activeTab === 'users' ? setShowCreateUser(true) : setShowCreateAgency(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create {activeTab === 'users' ? 'User' : 'Agency'}
          </Button>
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
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAgencies.map((agency) => (
              <Card key={agency.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900">{agency.name}</h3>
                    <p className="text-neutral-600">{agency.userCount} users</p>
                    <p className="text-xs text-neutral-500">
                      Created: {agency.createdAt.toLocaleDateString()}
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
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New User</h2>
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
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Create User
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateUser(false)}
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
      </div>
    </div>
  );
};

export default AdminDashboard;
