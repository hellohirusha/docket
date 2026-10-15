"use client";

import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function BulkDeleteToolbar({
  selecting, selectedCount, onStart, onCancel, onConfirm, pending,
}: {
  selecting: boolean;
  selectedCount: number;
  onStart: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  if (!selecting) {
    return <Button variant="outline" size="icon" aria-label="Select items to delete" onClick={onStart}><Trash2 className="h-4 w-4" /></Button>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{selectedCount} selected</span>
      <Button variant="ghost" size="icon" aria-label="Cancel selection" onClick={onCancel}><X className="h-4 w-4" /></Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="icon" aria-label="Delete selected items" disabled={selectedCount === 0 || pending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete selected items?</AlertDialogTitle>
            <AlertDialogDescription>This action permanently deletes {selectedCount} selected item{selectedCount === 1 ? "" : "s"}. Items with dependent records will be rejected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
