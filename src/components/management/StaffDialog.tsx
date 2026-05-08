import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

interface StaffFormData {
  name: string;
  pin: string;
  role: string;
}

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formData: StaffFormData;
  onFormChange: (data: StaffFormData) => void;
  onSave: () => void;
}

export function StaffDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  onFormChange,
  onSave,
}: StaffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Staff</DialogTitle>
          <DialogDescription>
            Update the profile and security settings for this employee.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          />
          <Label>Pin</Label>
          <Input
            type="password"
            maxLength={4}
            value={formData.pin}
            onChange={(e) => onFormChange({ ...formData, pin: e.target.value })}
          />
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => onFormChange({ ...formData, role: value })}
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
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}