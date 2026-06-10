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

interface BranchFormData {
  name: string;
  address: string;
}

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formData: BranchFormData;
  onFormChange: (data: BranchFormData) => void;
  onSave: () => void;
}

export function BranchDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  onFormChange,
  onSave,
}: BranchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Create'} Branch</DialogTitle>
          <DialogDescription>
            Enter the details for your branch location.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Label>Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => onFormChange({ ...formData, name: e.target.value })}
          />
          <Label>Address</Label>
          <Input
            value={formData.address}
            onChange={(e) => onFormChange({ ...formData, address: e.target.value })}
          />
        </div>
        <DialogFooter>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}