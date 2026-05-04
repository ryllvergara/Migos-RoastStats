import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Users, Store, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { RegisterModal } from '@/components/RegisterModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import logoImage from '@/assets/logoImage.png';

const BASE_URL = import.meta.env.VITE_BASE_URL;
const MANAGEMENT_URL = `${BASE_URL}/api/management`;

interface BranchData {
  id: string;
  branch_name: string;
  branch_address: string;
  created_at?: string;
}

interface StaffData {
  id: string;
  user_name: string;
  user_pin: string;
  user_role: string;
}

export function Management() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);
  const [loading, setLoading] = useState(true);
  const [managementTab, setManagementTab] = useState<'branches' | 'staff'>('branches');

  // Dialog & Form States
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffData | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string, type: 'branch' | 'staff' } | null>(null);
  const [branchFormData, setBranchFormData] = useState({ name: '', address: '' });
  const [staffFormData, setStaffFormData] = useState({ name: '', pin: '', role: 'employee' });

  // Fetch branches or staff based on active tab
  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = managementTab === 'branches' ? 'branches' : 'users';
      const res = await fetch(`${MANAGEMENT_URL}/${endpoint}`);
      const data = await res.json();
      if (managementTab === 'branches') setBranches(data || []);
      else setStaff(data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [managementTab]);

  // Branch Actions
  const handleSaveBranch = async () => {
    const method = editingBranch ? 'PATCH' : 'POST';
    const url = editingBranch ? `${MANAGEMENT_URL}/branches/${editingBranch.id}` : `${MANAGEMENT_URL}/branches`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_name: branchFormData.name,
          branch_address: branchFormData.address
        })
      });
      if (res.ok) {
        fetchData();
        setIsBranchDialogOpen(false);
      }
    } catch (err) { console.error(err); }
  };

  // Staff Actions
  const handleSaveStaff = async () => {
    const method = editingStaff ? 'PATCH' : 'POST';
    const url = editingStaff ? `${MANAGEMENT_URL}/users/${editingStaff.id}` : `${MANAGEMENT_URL}/users`;

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: staffFormData.name,
          user_pin: staffFormData.pin,
          user_role: staffFormData.role
        })
      });
      if (res.ok) {
        fetchData();
        setIsStaffDialogOpen(false);
      }
    } catch (err) { console.error(err); }
  };

  // Delete Action (for both branches and staff)
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const endpoint = deleteTarget.type === 'branch' ? 'branches' : 'users';
    try {
      await fetch(`${MANAGEMENT_URL}/${endpoint}/${deleteTarget.id}`, { method: 'DELETE' });
      fetchData();
      setIsDeleteDialogOpen(false);
    } catch (err) { console.error(err); }
  };

  // Open Dialogs with pre-filled data for editing or empty for creating new
  const openBranchEdit = (b?: BranchData) => {
    if (b) {
      setEditingBranch(b);
      setBranchFormData({ name: b.branch_name, address: b.branch_address });
    } else {
      setEditingBranch(null);
      setBranchFormData({ name: '', address: '' });
    }
    setIsBranchDialogOpen(true);
  };

  const openStaffEdit = (s?: StaffData) => {
    if (s) {
      setEditingStaff(s);
      setStaffFormData({ name: s.user_name, pin: "", role: s.user_role });
    } else {
      setEditingStaff(null);
      setStaffFormData({ name: '', pin: '', role: 'employee' });
    }
    setIsStaffDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
       {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={logoImage}
            alt="Migo's Lechon"
            className="h-16 w-16 rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold text-[#212121]">
              Management
            </h1>
            <p className="text-gray-600 font-medium">Manage branch and staff information</p>
          </div>
        </div>
      </div>
      <div className="mb-6 flex gap-4">
        <Button 
            variant={managementTab === 'branches' ? 'default' : 'outline'}
            onClick={() => setManagementTab('branches')}
            className={managementTab === 'branches' ? 'bg-[#D32F2F]' : ''}
        >
          <Store className="mr-2 h-4 w-4" /> Branches
        </Button>
        <Button 
            variant={managementTab === 'staff' ? 'default' : 'outline'}
            onClick={() => setManagementTab('staff')}
            className={managementTab === 'staff' ? 'bg-[#D32F2F]' : ''}
        >
          <Users className="mr-2 h-4 w-4" /> Staff
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-gray-300" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {managementTab === 'branches' ? (
            <>
              {branches.map(b => (
                <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="font-bold text-lg">{b.branch_name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mb-4">
                    <MapPin className="h-3 w-3 mr-1" /> {b.branch_address}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openBranchEdit(b)}><Edit2 className="h-3 w-3 mr-1"/> Edit</Button>
                    <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setDeleteTarget({id: b.id, type: 'branch'}); setIsDeleteDialogOpen(true); }}><Trash2 className="h-3 w-3 mr-1"/> Remove</Button>
                  </div>
                </div>
              ))}
              <Button variant="dashed" className="h-full border-2 border-dashed" onClick={() => openBranchEdit()}><Plus className="mr-2"/> Add Branch</Button>
            </>
          ) : (
             <>
             {staff.map(s => (
               <div key={s.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <h3 className="font-bold text-lg">{s.user_name}</h3>
                 <p className="text-sm text-gray-400 mb-4">{s.user_role} • PIN: ••••</p>
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => openStaffEdit(s)}><Edit2 className="h-3 w-3 mr-1"/> Edit</Button>
                   <Button variant="outline" size="sm" className="text-red-600" onClick={() => { setDeleteTarget({id: s.id, type: 'staff'}); setIsDeleteDialogOpen(true); }}><Trash2 className="h-3 w-3 mr-1"/> Remove</Button>
                 </div>
               </div>
             ))}
             <Button variant="dashed" className="h-full border-2 border-dashed" onClick={() => setIsRegisterModalOpen(true)}><Plus className="mr-2"/> Register Staff</Button>
           </>
          )}
        </div>
      )}

      {/* Branch Dialog */}
      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingBranch ? 'Edit' : 'Create'} Branch</DialogTitle>
            <DialogDescription>
              Enter the details for your branch location.
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Label>Name</Label>
                <Input value={branchFormData.name} onChange={e => setBranchFormData({...branchFormData, name: e.target.value})} />
                <Label>Address</Label>
                <Input value={branchFormData.address} onChange={e => setBranchFormData({...branchFormData, address: e.target.value})} />
            </div>
            <DialogFooter>
                <Button onClick={handleSaveBranch}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Staff Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingStaff ? 'Edit' : 'Create'} Staff</DialogTitle>
            <DialogDescription>
              Update the profile and security settings for this employee.
            </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <Label>Name</Label>
                <Input value={staffFormData.name} onChange={e => setStaffFormData({...staffFormData, name: e.target.value})} />
                <Label>Pin</Label>
                <Input type="password" maxLength={4} value={staffFormData.pin} onChange={e => setStaffFormData({...staffFormData, pin: e.target.value})} />
                <Label>Role</Label>
                <Select 
                  value={staffFormData.role} 
                  onValueChange={(value) => setStaffFormData({...staffFormData, role: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={handleSaveStaff}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Alert */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
             <AlertDialogDescription>Are you sure you want to delete this item? This action cannot be undone.</AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancel</AlertDialogCancel>
             <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600">Delete Permanently</AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
      <RegisterModal 
        isOpen={isRegisterModalOpen} 
        onClose={() => {
          setIsRegisterModalOpen(false);
          fetchData(); 
        }} 
      />
    </div>
  );
}