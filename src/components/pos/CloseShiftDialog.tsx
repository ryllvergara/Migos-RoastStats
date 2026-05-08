import { SaveAll } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';

interface CloseShiftDialogProps {
  branchName: string;
  onConfirm: () => void;
}

export function CloseShiftDialog({ branchName, onConfirm }: CloseShiftDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button className="mb-6 w-full rounded-xl border-2 border-dashed border-gray-300 bg-transparent py-4 text-gray-500 hover:border-[#D32F2F] hover:text-[#D32F2F] transition-all group">
          <div className="flex items-center justify-center gap-2">
            <SaveAll className="h-5 w-5 group-hover:animate-pulse" />
            <span className="font-semibold">Close Shift & Submit for Audit</span>
          </div>
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#212121]">Finalize Daily Sales?</AlertDialogTitle>
          <AlertDialogDescription>
            This will archive all current sales from <strong>{branchName}</strong> and notify the
            owner for audit. You won't be able to undo transactions after this.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl border-gray-200">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl bg-[#D32F2F] hover:bg-[#B71C1C] text-white"
          >
            Confirm Close Shift
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
