import { type Account, type UserRole, userRoleSchema } from '@repo/shared';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { label } from '@/lib/format';
import { useUpdateUserMutation } from '../mutations';

type EditorProps = { user: Account; self: boolean };

/** Saves one account's changes, toasting on failure. */
function useSaveUser(user: Account) {
  const { mutate, isPending } = useUpdateUserMutation(user.id);
  const save = (changes: { role?: UserRole; active?: boolean }) =>
    mutate(changes, {
      onError: () => toast.error(`Couldn't update ${user.name}. Try again.`),
    });
  return { save, isPending };
}

/** Changes an account's role; `self` locks the admin's own. */
export function RoleSelect({ user, self }: EditorProps) {
  const { save, isPending } = useSaveUser(user);

  return (
    <Select
      value={user.role}
      disabled={self || isPending}
      onValueChange={(value) => {
        const role = userRoleSchema.safeParse(value);
        if (role.success) save({ role: role.data });
      }}
    >
      <SelectTrigger className="w-32" aria-label={`${user.name}'s role`}>
        <SelectValue>{label(user.role)}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {userRoleSchema.options.map((role) => (
            <SelectItem key={role} value={role}>
              {label(role)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Activates an account, or deactivates it after confirming; `self` locks the admin's own. */
export function ActiveSwitch({ user, self }: EditorProps) {
  const { save, isPending } = useSaveUser(user);
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <Switch
        aria-label={`${user.name} is active`}
        checked={user.active}
        disabled={self || isPending}
        onCheckedChange={(active) =>
          active ? save({ active }) : setConfirming(true)
        }
      />
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {user.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They're signed out now and can't sign in until an admin
              reactivates the account. Their reports and messages stay.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirming(false);
                save({ active: false });
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
