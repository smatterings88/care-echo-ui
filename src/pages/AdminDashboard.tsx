import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { sendPasswordResetEmail } from "firebase/auth";
import { toast } from "sonner";
import ImageCrop from "@/components/ImageCrop";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  UserX,
  UploadCloud,
  Edit3
} from "lucide-react";
import { UserData, UserRole, AgencyData, CreateUserData, CreateAgencyData } from "@/types/auth";
import { getTimeZones } from "@vvo/tzdb";

// Safely convert Firestore Timestamp or Date-like values to Date
const toDateSafely = (value: unknown): Date => {
  if (!value) return new Date(0);
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  return new Date(0);
};

const AdminDashboard = () => {
  const { user, createUser, createAgency, getUsersByAgency, getUsersByAgencyIds, getAllUsers, getAgencies, getAgenciesByIds, updateUser, deleteUser } = useAuth();
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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [bulkIsProcessing, setBulkIsProcessing] = useState(false);
  const [bulkResults, setBulkResults] = useState<Array<{row:number,status:'success'|'error',message:string}>>([]);

  // Edit facility modal state
  const [editingAgency, setEditingAgency] = useState<AgencyData | null>(null);
  const [editAgencyName, setEditAgencyName] = useState<string>('');
  const [editAgencyForm, setEditAgencyForm] = useState<Partial<CreateAgencyData>>({});
  const [editAgencyLogoFile, setEditAgencyLogoFile] = useState<File | null>(null);

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState<Partial<UserData>>({});
  const [resetStatus, setResetStatus] = useState<string>("");

  // Create User form state
  const [userForm, setUserForm] = useState<CreateUserData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    agencyId: '',
    agencyIds: [],
  });
  const [createUserError, setCreateUserError] = useState<string>('');

  const [agencyForm, setAgencyForm] = useState<CreateAgencyData>({
    name: '',
    adminId: user?.uid || '',
    address: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    beds: undefined,
    numCNAs: 10,
    logoUrl: '',
    mainPhone: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    billingContactName: '',
    billingContactPhone: '',
    billingContactEmail: '',
  });
  const [agencyLogoFile, setAgencyLogoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Timezone dropdown state
  const [createTimezoneOpen, setCreateTimezoneOpen] = useState(false);
  const [editTimezoneOpen, setEditTimezoneOpen] = useState(false);
  
  // Image crop state
  const [showImageCrop, setShowImageCrop] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [cropType, setCropType] = useState<'create' | 'edit' | null>(null);

  // Function to delete image from storage
  const deleteImageFromStorage = async (imageUrl: string) => {
    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      return false;
    }
  };

  // Handle file selection for cropping
  const handleFileSelect = (file: File, type: 'create' | 'edit') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setImageToCrop(imageSrc);
      setCropType(type);
      setShowImageCrop(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle cropped image
  const handleCroppedImage = (croppedBlob: Blob) => {
    console.log('handleCroppedImage called with blob:', croppedBlob);
    const file = new File([croppedBlob], 'cropped-logo.jpg', { type: 'image/jpeg' });
    
    if (cropType === 'create') {
      setAgencyLogoFile(file);
    } else if (cropType === 'edit') {
      setEditAgencyLogoFile(file);
    }
    
    setShowImageCrop(false);
    setImageToCrop(null);
    setCropType(null);
    toast.success('Image cropped successfully');
  };

  // Cancel cropping
  const handleCancelCrop = () => {
    setShowImageCrop(false);
    setImageToCrop(null);
    setCropType(null);
  };

  // Time zones list (use Intl.supportedValuesOf if available, else fallback)
  const defaultTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const fallbackTimeZones = [
    'UTC','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Anchorage','Pacific/Honolulu',
    'Europe/London','Europe/Berlin','Europe/Paris','Europe/Madrid','Europe/Rome','Europe/Warsaw',
    'Africa/Johannesburg','Asia/Dubai','Asia/Kolkata','Asia/Bangkok','Asia/Singapore','Asia/Shanghai','Asia/Tokyo',
    'Australia/Sydney','Pacific/Auckland'
  ];
  const formatOffset = (minutes: number): string => {
    const sign = minutes >= 0 ? '+' : '-';
    const abs = Math.abs(minutes);
    const hh = String(Math.floor(abs / 60)).padStart(2, '0');
    const mm = String(abs % 60).padStart(2, '0');
    return `${sign}${hh}:${mm}`;
  };
  const tzdb = getTimeZones();
  const timeZoneOptions: Array<{ value: string; label: string }> = (tzdb && tzdb.length > 0)
    ? tzdb.map(t => ({
        value: t.name,
        label: `${t.alternativeName || t.mainCities?.[0] || t.name} (${t.name}) — GMT${formatOffset(t.currentTimeOffsetInMinutes)}`
      }))
    : fallbackTimeZones.map(name => ({ value: name, label: name }));

  useEffect(() => {
    loadData();
  }, []);

  // When opening Create User, prefill restrictions for site_admin creators
  useEffect(() => {
    if (showCreateUser && user?.role === 'site_admin') {
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
      let agenciesData: AgencyData[] = [];
      let usersData: UserData[] = [];

      if (user?.role === 'super_admin') {
        [agenciesData, usersData] = await Promise.all([
          getAgencies(),
          getAllUsers(),
        ]);
      } else if (user?.role === 'org_admin' && user.agencyIds && user.agencyIds.length > 0) {
        agenciesData = await getAgenciesByIds(user.agencyIds);
        usersData = await getUsersByAgencyIds(user.agencyIds);
      } else if (user?.role === 'site_admin' && user.agencyId) {
        agenciesData = (await getAgencies()).filter(a => a.id === user.agencyId);
        usersData = await getUsersByAgency(user.agencyId);
      } else {
        agenciesData = [];
        usersData = [];
      }

      setAgencies(agenciesData || []);
      setUsers(usersData || []);

      // Derive accurate user counts per agency from fresh user list
      const counts: Record<string, number> = {};
      (usersData || []).forEach((u) => {
        const aId = (u as UserData).agencyId;
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
          // Enforce agency assignment requirement for non-super_admin users
    if (userForm.role !== 'super_admin' && userForm.role !== 'org_admin' && !userForm.agencyId) {
      setCreateUserError('Please select a facility for the new user.');
      return;
    }

    // Enforce agency assignment requirement for org_admins
    if (userForm.role === 'org_admin' && (!userForm.agencyIds || userForm.agencyIds.length === 0)) {
        setCreateUserError('Please select at least one facility for the manager.');
        return;
      }

      // Enforce agency user constraints: force role=user and agencyId to creator's agency
      let payload: CreateUserData;
      if (user?.role === 'site_admin') {
        payload = {
          email: userForm.email,
          password: userForm.password,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          role: 'user',
          agencyId: user.agencyId || '',
        };
      } else if (user?.role === 'org_admin') {
        // Org_admins can only create users for their assigned agencies
        payload = {
          email: userForm.email,
          password: userForm.password,
          firstName: userForm.firstName,
          lastName: userForm.lastName,
          role: 'user',
          agencyId: userForm.agencyId || '',
        };
      } else {
        payload = userForm;
      }

      await createUser(payload);
      setUserForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user',
        agencyId: '',
        agencyIds: [],
      });
      setShowCreateUser(false);
      loadData();
    } catch (error: unknown) {
      console.error('Failed to create user:', error);
      setCreateUserError(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let logoUrl = agencyForm.logoUrl || '';
      // Upload logo first if provided
      if (agencyLogoFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const tmpId = crypto?.randomUUID?.() || `${Date.now()}`;
        const path = `facilities/tmp-${tmpId}/logo-${agencyLogoFile.name}`;
        const sRef = ref(storage, path);
        
        // Upload with progress tracking
        const uploadTask = uploadBytes(sRef, agencyLogoFile);
        uploadTask.then(() => {
          setUploadProgress(100);
          return getDownloadURL(sRef);
        }).then((url) => {
          logoUrl = url;
          setAgencyForm(prev => ({ ...prev, logoUrl }));
        });
        
        await uploadTask;
        logoUrl = await getDownloadURL(sRef);
        setIsUploading(false);
        setUploadProgress(0);
      }
      await createAgency({ ...agencyForm, logoUrl });
      setAgencyForm({
        name: '',
        adminId: user?.uid || '',
        address: '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        beds: undefined,
        numCNAs: 10,
        logoUrl: '',
        mainPhone: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        billingContactName: '',
        billingContactPhone: '',
        billingContactEmail: '',
      });
      setAgencyLogoFile(null);
      setShowCreateAgency(false);
      loadData();
    } catch (error) {
      console.error('Failed to create agency:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateFacilityFromUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let logoUrl = agencyForm.logoUrl || '';
      // Upload logo first if provided
      if (agencyLogoFile) {
        setIsUploading(true);
        setUploadProgress(0);
        const tmpId = crypto?.randomUUID?.() || `${Date.now()}`;
        const path = `facilities/tmp-${tmpId}/logo-${agencyLogoFile.name}`;
        const sRef = ref(storage, path);
        
        // Upload with progress tracking
        const uploadTask = uploadBytes(sRef, agencyLogoFile);
        uploadTask.then(() => {
          setUploadProgress(100);
          return getDownloadURL(sRef);
        }).then((url) => {
          logoUrl = url;
          setAgencyForm(prev => ({ ...prev, logoUrl }));
        });
        
        await uploadTask;
        logoUrl = await getDownloadURL(sRef);
        setIsUploading(false);
        setUploadProgress(0);
      }
      const newAgency = await createAgency({ ...agencyForm, logoUrl });
      setAgencyForm({
        name: '',
        adminId: user?.uid || '',
      });
      setAgencyLogoFile(null);
      setShowCreateAgencyFromUser(false);
      // Reload agencies to update the dropdown
      const agenciesData = await getAgencies();
      setAgencies(agenciesData || []);
      // Auto-select the newly created agency
      if (newAgency?.id) {
        setUserForm(prev => ({ ...prev, agencyId: newAgency.id }));
      }
    } catch (error) {
      console.error('Failed to create facility:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openEditUser = (u: UserData) => {
    setEditingUser(u);
    // Handle backward compatibility - if firstName/lastName don't exist, parse from displayName
    const firstName = u.firstName || (u.displayName ? u.displayName.split(' ')[0] : '');
    const lastName = u.lastName || (u.displayName ? u.displayName.split(' ').slice(1).join(' ') : '');
    setEditForm({
      firstName,
      lastName,
      role: u.role,
      agencyId: u.agencyId,
      isActive: u.isActive,
    });
  };

  const submitEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const firstName = editForm.firstName || editingUser.firstName || '';
      const lastName = editForm.lastName || editingUser.lastName || '';
      const displayName = `${firstName} ${lastName}`.trim();
      
      await updateUser(editingUser.uid, {
        firstName,
        lastName,
        displayName,
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
          <div className="flex items-center space-x-2">
            <Button asChild variant="outline" className="focus-ring">
              <Link to="/user-checkin">
                <UserCheck className="h-4 w-4 mr-2" />
                User Check-in
              </Link>
            </Button>
            <Button asChild variant="outline" className="focus-ring">
              <Link to="/">← Back to landing</Link>
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 px-2 py-1 flex items-center space-x-2 hover:bg-neutral-100"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>
                        {(user.displayName || '').split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.displayName}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                        user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'org_admin' ? 'Org Admin' :
                       user.role === 'site_admin' ? 'Site Admin' : 'User'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'org_admin' ? 'bg-purple-600 text-white' :
                        user.role === 'site_admin' ? 'bg-accent-teal text-white' :
                        'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' :
                       user.role === 'org_admin' ? 'Org Admin' :
                       user.role === 'site_admin' ? 'Site Admin' : 'User'}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
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
                <p className="text-sm text-neutral-600">Total Facilities</p>
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
            Facilities
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          {activeTab === 'users' ? (
            <div className="flex gap-2">
              <Button
                onClick={() => setShowCreateUser(true)}
                className="btn-primary"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
              <Button variant="outline" onClick={() => setShowBulkImport(true)} className="flex items-center">
                <UploadCloud className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
            </div>
          ) : (
            user?.role !== 'site_admin' && (
              <Button
                onClick={() => setShowCreateAgency(true)}
                className="btn-primary"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Create Facility
              </Button>
            )
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
                        user.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        user.role === 'site_admin' ? 'bg-accent-teal text-white' :
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
                              } catch (err: unknown) {
                                console.error('Error deleting user:', err);
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
                  <div className="flex items-center space-x-4">
                    {/* Facility Logo */}
                    <div className="flex-shrink-0">
                      {agency.logoUrl ? (
                        <img
                          src={agency.logoUrl}
                          alt={`${agency.name} logo`}
                          className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                          onError={(e) => {
                            // Hide image if it fails to load
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-neutral-100 rounded-lg border border-neutral-200 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Facility Info */}
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
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.role !== 'site_admin' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAgency(agency);
                            setEditAgencyName(agency.name || '');
                            setEditAgencyForm({
                              address: agency.address || '',
                              timeZone: agency.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                              beds: agency.beds,
                              numCNAs: agency.numCNAs ?? 10,
                              logoUrl: agency.logoUrl || '',
                              mainPhone: agency.mainPhone || '',
                              contactName: agency.contactName || '',
                              contactPhone: agency.contactPhone || '',
                              contactEmail: agency.contactEmail || '',
                              billingContactName: agency.billingContactName || '',
                              billingContactPhone: agency.billingContactPhone || '',
                              billingContactEmail: agency.billingContactEmail || '',
                            });
                            setEditAgencyLogoFile(null);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-error hover:text-error">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {filteredAgencies.length === 0 && (
              <Card className="p-6">
                <p className="text-neutral-600">No facilities yet. Create one to get started.</p>
              </Card>
            )}
          </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New User</h2>
              {createUserError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{createUserError}</p>
                </div>
              )}
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
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
                {user?.role === 'site_admin' ? (
                  <div className="text-sm text-neutral-600">
                    This user will be assigned to your facility automatically.
                  </div>
                ) : user?.role === 'org_admin' ? (
                  <div className="text-sm text-neutral-600">
                    You can create users for your assigned facilities.
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
                          <SelectItem value="site_admin">Site Admin</SelectItem>
                          {user?.role === 'super_admin' && (
                            <SelectItem value="org_admin">Org Admin</SelectItem>
                          )}
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label htmlFor="agencyId">
                          {userForm.role === 'org_admin' ? 'Assign Facilities' : 'Assign Facility'} 
                          {userForm.role !== 'super_admin' ? '*' : '(optional)'}
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateAgencyFromUser(true)}
                          className="text-xs"
                        >
                          <Building2 className="h-3 w-3 mr-1" />
                          Add Facility
                        </Button>
                      </div>
                      {userForm.role === 'org_admin' ? (
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
                              <SelectValue placeholder="Select facilities to assign" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select a facility</SelectItem>
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
                          required={userForm.role !== 'super_admin'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select an agency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {agencies
                              .filter(agency => 
                                user?.role === 'super_admin' || 
                                (user?.role === 'org_admin' && user?.agencyIds?.includes(agency.id))
                              )
                              .map((a) => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))
                            }
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
              <DialogTitle>Facility Users</DialogTitle>
              <DialogDescription>
                List of users assigned to this facility.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[50vh] overflow-auto">
              {users.filter(u => u.agencyId === openAgencyUsersFor).length === 0 ? (
                <p className="text-neutral-600 text-sm">No users in this facility yet.</p>
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
                        u.role === 'super_admin' ? 'bg-brand-red-600 text-white' :
                        u.role === 'site_admin' ? 'bg-accent-teal text-white' :
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
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Edit User</h2>
              <form onSubmit={submitEditUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName">First Name</Label>
                    <Input
                      id="editFirstName"
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName">Last Name</Label>
                    <Input
                      id="editLastName"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
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
                      <SelectItem value="site_admin">Site Admin</SelectItem>
                      {user?.role === 'super_admin' && (
                        <SelectItem value="org_admin">Org Admin</SelectItem>
                      )}
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editAgency">Facility</Label>
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
                        } catch (err: unknown) {
                          setResetStatus(err instanceof Error ? err.message : "Failed to send reset email");
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
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New Facility</h2>
              <form onSubmit={handleCreateAgency} className="space-y-4">
                <div>
                  <Label htmlFor="agencyName">Facility Name</Label>
                  <Input id="agencyName" value={agencyForm.name} onChange={(e) => setAgencyForm(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="agencyAddress">Address</Label>
                  <Input id="agencyAddress" value={agencyForm.address || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agencyTZ">Time Zone</Label>
                    <Popover open={createTimezoneOpen} onOpenChange={setCreateTimezoneOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={createTimezoneOpen}
                          className="w-full justify-between"
                        >
                          {agencyForm.timeZone || defaultTimeZone}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search timezone..." />
                          <CommandList>
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            <CommandGroup>
                              {timeZoneOptions.map((tz) => (
                                <CommandItem
                                  key={tz.value}
                                  value={tz.label}
                                  onSelect={(currentValue) => {
                                    setAgencyForm(prev => ({ ...prev, timeZone: tz.value }));
                                    setCreateTimezoneOpen(false);
                                  }}
                                >
                                  {tz.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="agencyBeds"># of Beds</Label>
                    <Input id="agencyBeds" type="number" min={0} value={agencyForm.beds ?? ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, beds: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="agencyCNAs"># of CNA’s</Label>
                    <Input id="agencyCNAs" type="number" min={0} value={agencyForm.numCNAs ?? 10} onChange={(e) => setAgencyForm(prev => ({ ...prev, numCNAs: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                  <div>
                    <Label htmlFor="agencyMainPhone">Main Phone</Label>
                    <Input id="agencyMainPhone" value={agencyForm.mainPhone || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, mainPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="agencyLogo">Facility Logo</Label>
                  <Input 
                    id="agencyLogo" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        handleFileSelect(file, 'create');
                      }
                    }} 
                  />
                  
                  {/* Image Preview */}
                  {(agencyForm.logoUrl || agencyLogoFile) && (
                    <div className="mt-3 p-3 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Logo Preview</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (agencyForm.logoUrl) {
                              try {
                                toast.loading('Deleting logo...', { id: 'delete-logo' });
                                const success = await deleteImageFromStorage(agencyForm.logoUrl);
                                if (success) {
                                  setAgencyForm(prev => ({ ...prev, logoUrl: '' }));
                                  setAgencyLogoFile(null);
                                  // Also update the facility document in Firestore if it exists
                                  if (editingAgency?.id) {
                                    try {
                                      console.log('Deleting logoUrl field from Firestore document:', editingAgency.id);
                                      console.log('Current editingAgency:', editingAgency);
                                      const docRef = doc(db, 'agencies', editingAgency.id);
                                      console.log('Document reference:', docRef);
                                      await updateDoc(docRef, {
                                        logoUrl: deleteField()
                                      });
                                      console.log('Successfully deleted logoUrl field from Firestore');
                                    } catch (error) {
                                      console.error('Failed to update facility logo URL:', error);
                                      console.error('Error details:', error);
                                    }
                                  } else {
                                    console.log('No editingAgency.id found, skipping Firestore update');
                                    console.log('editingAgency:', editingAgency);
                                  }
                                  toast.success('Logo deleted successfully', { id: 'delete-logo' });
                                } else {
                                  toast.error('Failed to delete logo', { id: 'delete-logo' });
                                }
                              } catch (error) {
                                console.error('Error deleting logo:', error);
                                toast.error('Failed to delete logo', { id: 'delete-logo' });
                              }
                            } else {
                              setAgencyLogoFile(null);
                              toast.success('Logo removed', { id: 'delete-logo' });
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={agencyLogoFile ? URL.createObjectURL(agencyLogoFile) : agencyForm.logoUrl}
                          alt="Facility logo preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-neutral-600">
                            {agencyLogoFile ? agencyLogoFile.name : 'Uploaded logo'}
                          </div>
                          {agencyForm.logoUrl && (
                            <div className="text-xs text-green-600">✓ Uploaded successfully</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="text-sm text-neutral-600 mb-1">Uploading logo...</div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-brand-red-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" value={agencyForm.contactName || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, contactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <Input id="contactPhone" value={agencyForm.contactPhone || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, contactPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input id="contactEmail" type="email" value={agencyForm.contactEmail || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, contactEmail: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingContact">Billing Contact</Label>
                    <Input id="billingContact" value={agencyForm.billingContactName || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, billingContactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="billingPhone">Billing Contact Phone</Label>
                    <Input id="billingPhone" value={agencyForm.billingContactPhone || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, billingContactPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="billingEmail">Billing Contact Email</Label>
                  <Input id="billingEmail" type="email" value={agencyForm.billingContactEmail || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, billingContactEmail: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Create Facility
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

        {/* Create Facility Modal (from User Creation) */}
        {showCreateAgencyFromUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Create New Facility</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Create a new facility to assign to the user you're creating.
              </p>
              <form onSubmit={handleCreateFacilityFromUser} className="space-y-4">
                <div>
                  <Label htmlFor="facilityNameFromUser">Facility Name</Label>
                  <Input id="facilityNameFromUser" value={agencyForm.name} onChange={(e) => setAgencyForm(prev => ({ ...prev, name: e.target.value }))} required />
                </div>
                <div>
                  <Label htmlFor="facilityAddressFromUser">Address</Label>
                  <Input id="facilityAddressFromUser" value={agencyForm.address || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facilityTZFromUser">Time Zone</Label>
                    <Popover open={createTimezoneOpen} onOpenChange={setCreateTimezoneOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={createTimezoneOpen}
                          className="w-full justify-between"
                        >
                          {agencyForm.timeZone || defaultTimeZone}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search timezone..." />
                          <CommandList>
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            <CommandGroup>
                              {timeZoneOptions.map((tz) => (
                                <CommandItem
                                  key={tz.value}
                                  value={tz.label}
                                  onSelect={(currentValue) => {
                                    setAgencyForm(prev => ({ ...prev, timeZone: tz.value }));
                                    setCreateTimezoneOpen(false);
                                  }}
                                >
                                  {tz.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="facilityBedsFromUser"># of Beds</Label>
                    <Input id="facilityBedsFromUser" type="number" min={0} value={agencyForm.beds ?? ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, beds: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="facilityCNAsFromUser"># of CNA's</Label>
                    <Input id="facilityCNAsFromUser" type="number" min={0} value={agencyForm.numCNAs ?? 10} onChange={(e) => setAgencyForm(prev => ({ ...prev, numCNAs: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                  <div>
                    <Label htmlFor="facilityMainPhoneFromUser">Main Phone</Label>
                    <Input id="facilityMainPhoneFromUser" value={agencyForm.mainPhone || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, mainPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="facilityLogoFromUser">Facility Logo</Label>
                  <Input 
                    id="facilityLogoFromUser" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        handleFileSelect(file, 'create');
                      }
                    }} 
                  />
                  
                  {/* Image Preview */}
                  {(agencyForm.logoUrl || agencyLogoFile) && (
                    <div className="mt-3 p-3 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Logo Preview</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            if (agencyForm.logoUrl) {
                              try {
                                toast.loading('Deleting logo...', { id: 'delete-logo-from-user' });
                                const success = await deleteImageFromStorage(agencyForm.logoUrl);
                                if (success) {
                                  setAgencyForm(prev => ({ ...prev, logoUrl: '' }));
                                  setAgencyLogoFile(null);
                                  toast.success('Logo deleted successfully', { id: 'delete-logo-from-user' });
                                } else {
                                  toast.error('Failed to delete logo', { id: 'delete-logo-from-user' });
                                }
                              } catch (error) {
                                console.error('Error deleting logo:', error);
                                toast.error('Failed to delete logo', { id: 'delete-logo-from-user' });
                              }
                            } else {
                              setAgencyLogoFile(null);
                              toast.success('Logo removed', { id: 'delete-logo-from-user' });
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={agencyLogoFile ? URL.createObjectURL(agencyLogoFile) : agencyForm.logoUrl}
                          alt="Facility logo preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-neutral-600">
                            {agencyLogoFile ? agencyLogoFile.name : 'Uploaded logo'}
                          </div>
                          {agencyForm.logoUrl && (
                            <div className="text-xs text-green-600">✓ Uploaded successfully</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="text-sm text-neutral-600 mb-1">Uploading logo...</div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-brand-red-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactNameFromUser">Contact Name</Label>
                    <Input id="contactNameFromUser" value={agencyForm.contactName || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, contactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="contactPhoneFromUser">Contact Phone</Label>
                    <Input id="contactPhoneFromUser" value={agencyForm.contactPhone || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, contactPhone: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactEmailFromUser">Contact Email</Label>
                    <Input id="contactEmailFromUser" type="email" value={agencyForm.contactEmail || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, contactEmail: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billingContactFromUser">Billing Contact</Label>
                    <Input id="billingContactFromUser" value={agencyForm.billingContactName || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, billingContactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="billingPhoneFromUser">Billing Contact Phone</Label>
                    <Input id="billingPhoneFromUser" value={agencyForm.billingContactPhone || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, billingContactPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="billingEmailFromUser">Billing Contact Email</Label>
                  <Input id="billingEmailFromUser" type="email" value={agencyForm.billingContactEmail || ''} onChange={(e) => setAgencyForm(prev => ({ ...prev, billingContactEmail: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">
                    Create Facility
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

        {/* Bulk Import Modal */}
        {showBulkImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">Bulk Import Users (CSV)</h2>
                <Button variant="ghost" onClick={() => setShowBulkImport(false)}>Close</Button>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-neutral-700">
                  Paste CSV with headers: firstName,lastName,email,password,agency
                </p>
                <textarea
                  value={bulkCsvText}
                  onChange={(e) => setBulkCsvText(e.target.value)}
                  rows={10}
                  className="w-full border border-neutral-200 rounded-md p-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  placeholder={"firstName,lastName,email,password,agency\nJane,Doe,jane@example.com,TempPass123,Acme Care Home"}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-neutral-500">
                    - Bulk import is limited to regular users only.\n
                    - Use agency name (preferred) or agency ID in the 'agency' column.\n
                    - Admins, managers, and agency users can bulk import users (assigned per their permissions). Managers/admins must create managers/admins individually.
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setBulkCsvText("")}>Clear</Button>
                    <Button onClick={async () => {
                      if (!bulkCsvText.trim()) return;
                      setBulkIsProcessing(true);
                      setBulkResults([]);
                      const lines = bulkCsvText.split(/\r?\n/).filter(l => l.trim().length > 0);
                      if (lines.length <= 1) {
                        setBulkResults([{row:0,status:'error',message:'No data rows found under headers'}]);
                        setBulkIsProcessing(false);
                        return;
                      }
                      const headers = lines[0].split(',').map(h => h.trim());
                      const idx = (name:string) => headers.indexOf(name);
                      const has = (name:string) => idx(name) !== -1;
                      const required = ['firstName','lastName','email','password'];
                      for (const r of required) {
                        if (!has(r)) {
                          setBulkResults([{row:0,status:'error',message:`Missing required header: ${r}` }]);
                          setBulkIsProcessing(false);
                          return;
                        }
                      }
                      if (!has('agency') && !has('agencyId')) {
                        setBulkResults([{row:0,status:'error',message:`Missing required header: agency (or legacy agencyId)` }]);
                        setBulkIsProcessing(false);
                        return;
                      }
                      const results: Array<{row:number,status:'success'|'error',message:string}> = [];
                      for (let i = 1; i < lines.length; i++) {
                        const rowNum = i; // 1-based excluding header note in result
                        try {
                          const raw = lines[i];
                          const cols = raw.split(',');
                          const get = (name:string) => cols[idx(name)]?.trim() || '';
                          const firstName = get('firstName');
                          const lastName = get('lastName');
                          const email = get('email');
                          const password = get('password');
                          const role: UserRole = 'user'; // Bulk import restricted to users
                          const agencyVal = has('agency') ? get('agency') : (has('agencyId') ? get('agencyId') : '');
                          // Resolve agency: accept ID match or case-insensitive name match
                          const agencyMatch = agencies.find(a => a.id === agencyVal) ||
                            agencies.find(a => (a.name || '').toLowerCase() === agencyVal.toLowerCase());
                          const resolvedAgencyId = agencyMatch?.id || '';
                          if (!resolvedAgencyId && user?.role !== 'site_admin') {
                            throw new Error(`Agency not found: '${agencyVal}'`);
                          }

                          // Enforce creator role constraints
                          let payload: CreateUserData;
                          if (user?.role === 'site_admin') {
                            payload = { email, password, firstName, lastName, role: 'user', agencyId: user.agencyId || '' };
                          } else if (user?.role === 'org_admin') {
                            // Org_admins can only create users for their assigned agencies
                            const chosenAgencyId = resolvedAgencyId && user.agencyIds?.includes(resolvedAgencyId) ? resolvedAgencyId : '';
                            if (!chosenAgencyId) throw new Error('Manager can only assign users to own agencies');
                            payload = { email, password, firstName, lastName, role: 'user', agencyId: chosenAgencyId };
                          } else {
                            // Admin can only bulk create users
                            const finalAgencyId = resolvedAgencyId;
                            if (!finalAgencyId) throw new Error('Agency is required for bulk user import');
                            payload = { email, password, firstName, lastName, role, agencyId: finalAgencyId };
                          }

                          await createUser(payload);
                          results.push({row: rowNum, status:'success', message: `${email} created`});
                        } catch (e: unknown) {
                          results.push({row: rowNum, status:'error', message: e instanceof Error ? e.message : 'Unknown error'});
                        }
                      }
                      setBulkResults(results);
                      setBulkIsProcessing(false);
                      // Refresh data so newly imported users appear in the list
                      try { await loadData(); } catch {}
                    }} disabled={bulkIsProcessing}>
                      {bulkIsProcessing ? 'Importing...' : 'Import'}
                    </Button>
                  </div>
                </div>
                {bulkResults.length > 0 && (
                  <div className="mt-4 border border-neutral-200 rounded-md p-3 max-h-60 overflow-auto">
                    {bulkResults.map((r, i) => (
                      <div key={i} className={`text-sm ${r.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                        Row {r.row}: {r.status.toUpperCase()} - {r.message}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowBulkImport(false)}>Done</Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Edit Facility Modal */}
        {editingAgency && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">Edit Facility</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    if (!editingAgency?.id) return;
                    // Upload new logo if provided
                    let logoUrl = editAgencyForm.logoUrl;
                    // If logoUrl is explicitly set to empty string (deleted), keep it empty
                    // Otherwise, fall back to original value
                    if (logoUrl === undefined) {
                      logoUrl = editingAgency.logoUrl || '';
                    }
                    if (editAgencyLogoFile) {
                      setIsUploading(true);
                      setUploadProgress(0);
                      const path = `facilities/${editingAgency.id}/logo-${editAgencyLogoFile.name}`;
                      const sRef = ref(storage, path);
                      
                      // Upload with progress tracking
                      const uploadTask = uploadBytes(sRef, editAgencyLogoFile);
                      uploadTask.then(() => {
                        setUploadProgress(100);
                        return getDownloadURL(sRef);
                      }).then((url) => {
                        logoUrl = url;
                        setEditAgencyForm(prev => ({ ...prev, logoUrl }));
                      });
                      
                      await uploadTask;
                      logoUrl = await getDownloadURL(sRef);
                      setIsUploading(false);
                      setUploadProgress(0);
                    }
                    await updateDoc(doc(db, 'agencies', editingAgency.id), {
                      name: editAgencyName,
                      address: editAgencyForm.address || '',
                      timeZone: editAgencyForm.timeZone || null,
                      beds: editAgencyForm.beds ?? null,
                      numCNAs: editAgencyForm.numCNAs ?? null,
                      logoUrl: logoUrl === '' ? deleteField() : (logoUrl || null),
                      mainPhone: editAgencyForm.mainPhone || '',
                      contactName: editAgencyForm.contactName || '',
                      contactPhone: editAgencyForm.contactPhone || '',
                      contactEmail: editAgencyForm.contactEmail || '',
                      billingContactName: editAgencyForm.billingContactName || '',
                      billingContactPhone: editAgencyForm.billingContactPhone || '',
                      billingContactEmail: editAgencyForm.billingContactEmail || '',
                    });
                    setEditingAgency(null);
                    setEditAgencyName('');
                    setEditAgencyForm({});
                    setEditAgencyLogoFile(null);
                    await loadData();
                  } catch (err) {
                    console.error('Failed to update facility:', err);
                    setIsUploading(false);
                    setUploadProgress(0);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="editFacilityName">Facility Name</Label>
                  <Input id="editFacilityName" value={editAgencyName} onChange={(e) => setEditAgencyName(e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="editFacilityAddress">Address</Label>
                  <Input id="editFacilityAddress" value={editAgencyForm.address || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, address: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFacilityTZ">Time Zone</Label>
                    <Popover open={editTimezoneOpen} onOpenChange={setEditTimezoneOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={editTimezoneOpen}
                          className="w-full justify-between"
                        >
                          {editAgencyForm.timeZone || defaultTimeZone}
                          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search timezone..." />
                          <CommandList>
                            <CommandEmpty>No timezone found.</CommandEmpty>
                            <CommandGroup>
                              {timeZoneOptions.map((tz) => (
                                <CommandItem
                                  key={tz.value}
                                  value={tz.label}
                                  onSelect={(currentValue) => {
                                    setEditAgencyForm(prev => ({ ...prev, timeZone: tz.value }));
                                    setEditTimezoneOpen(false);
                                  }}
                                >
                                  {tz.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="editFacilityBeds"># of Beds</Label>
                    <Input id="editFacilityBeds" type="number" min={0} value={editAgencyForm.beds ?? ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, beds: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFacilityCNAs"># of CNA’s</Label>
                    <Input id="editFacilityCNAs" type="number" min={0} value={editAgencyForm.numCNAs ?? 10} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, numCNAs: e.target.value ? Number(e.target.value) : undefined }))} />
                  </div>
                  <div>
                    <Label htmlFor="editFacilityPhone">Main Phone</Label>
                    <Input id="editFacilityPhone" value={editAgencyForm.mainPhone || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, mainPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editFacilityLogo">Facility Logo</Label>
                  <Input 
                    id="editFacilityLogo" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) {
                        handleFileSelect(file, 'edit');
                      }
                    }} 
                  />
                  
                  {/* Image Preview */}
                  {(editAgencyForm.logoUrl || editingAgency?.logoUrl || editAgencyLogoFile) && (
                    <div className="mt-3 p-3 border border-neutral-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-700">Logo Preview</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const currentLogoUrl = editAgencyForm.logoUrl || editingAgency?.logoUrl;
                            if (currentLogoUrl) {
                              try {
                                toast.loading('Deleting logo...', { id: 'delete-logo-edit' });
                                const success = await deleteImageFromStorage(currentLogoUrl);
                                if (success) {
                                  setEditAgencyForm(prev => ({ ...prev, logoUrl: '' }));
                                  setEditAgencyLogoFile(null);
                                  // Update the facility document in Firestore
                                  if (editingAgency?.id) {
                                    try {
                                      console.log('Deleting logoUrl field from Firestore document:', editingAgency.id);
                                      console.log('Current editingAgency:', editingAgency);
                                      const docRef = doc(db, 'agencies', editingAgency.id);
                                      console.log('Document reference:', docRef);
                                      await updateDoc(docRef, {
                                        logoUrl: deleteField()
                                      });
                                      console.log('Successfully deleted logoUrl field from Firestore');
                                    } catch (error) {
                                      console.error('Failed to update facility logo URL:', error);
                                      console.error('Error details:', error);
                                    }
                                  } else {
                                    console.log('No editingAgency.id found, skipping Firestore update');
                                    console.log('editingAgency:', editingAgency);
                                  }
                                  toast.success('Logo deleted successfully', { id: 'delete-logo-edit' });
                                } else {
                                  toast.error('Failed to delete logo', { id: 'delete-logo-edit' });
                                }
                              } catch (error) {
                                console.error('Error deleting logo:', error);
                                toast.error('Failed to delete logo', { id: 'delete-logo-edit' });
                              }
                            } else {
                              setEditAgencyLogoFile(null);
                              toast.success('Logo removed', { id: 'delete-logo-edit' });
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src={editAgencyLogoFile ? URL.createObjectURL(editAgencyLogoFile) : (editAgencyForm.logoUrl || editingAgency?.logoUrl)}
                          alt="Facility logo preview"
                          className="w-16 h-16 object-cover rounded border"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-neutral-600">
                            {editAgencyLogoFile ? editAgencyLogoFile.name : 'Current logo'}
                          </div>
                          {(editAgencyForm.logoUrl || editingAgency?.logoUrl) && (
                            <div className="text-xs text-green-600">✓ Logo available</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mt-2">
                      <div className="text-sm text-neutral-600 mb-1">Uploading logo...</div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div 
                          className="bg-brand-red-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editContactName">Contact Name</Label>
                    <Input id="editContactName" value={editAgencyForm.contactName || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, contactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="editContactPhone">Contact Phone</Label>
                    <Input id="editContactPhone" value={editAgencyForm.contactPhone || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, contactPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editContactEmail">Contact Email</Label>
                  <Input id="editContactEmail" type="email" value={editAgencyForm.contactEmail || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, contactEmail: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editBillingName">Billing Contact</Label>
                    <Input id="editBillingName" value={editAgencyForm.billingContactName || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, billingContactName: e.target.value }))} />
                  </div>
                  <div>
                    <Label htmlFor="editBillingPhone">Billing Contact Phone</Label>
                    <Input id="editBillingPhone" value={editAgencyForm.billingContactPhone || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, billingContactPhone: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editBillingEmail">Billing Contact Email</Label>
                  <Input id="editBillingEmail" type="email" value={editAgencyForm.billingContactEmail || ''} onChange={(e) => setEditAgencyForm(prev => ({ ...prev, billingContactEmail: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="btn-primary flex-1">Save Changes</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setEditingAgency(null); setEditAgencyName(''); setEditAgencyForm({}); setEditAgencyLogoFile(null); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Image Crop Modal */}
        {showImageCrop && imageToCrop && (
          <ImageCrop
            imageSrc={imageToCrop}
            onCrop={handleCroppedImage}
            onCancel={handleCancelCrop}
            aspectRatio={1}
            cropSize={{ width: 200, height: 200 }}
          />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
