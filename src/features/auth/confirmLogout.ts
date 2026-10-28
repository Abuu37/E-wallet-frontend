import Swal from 'sweetalert2'

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
  return result.isConfirmed
}
