import Swal from 'sweetalert2'
import { toast } from '../../lib/toast'

/** Shows a confirmation dialog before logging out. Resolves true only if the user confirms. */
export async function confirmLogout(): Promise<boolean> {
  const result = await Swal.fire({
    icon: 'warning',
    iconColor: '#dc2626',
    title: 'Log out?',
    text: "You'll need to sign in again to access your account.",
    showCancelButton: true,
    confirmButtonText: 'Log out',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#64748b',
  })

  if (!result.isConfirmed) return false

  toast.success('Logout Successful', {
    description: "You've been logged out.",
    duration: 1500,
  })

  return true
}
