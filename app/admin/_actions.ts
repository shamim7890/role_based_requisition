'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

export async function setRole(formData: FormData) {
  const client = await clerkClient()
  const userId = formData.get('id') as string
  const role = formData.get('role') as string

  // Check that the user trying to set the role is an admin
  if (!checkRole('admin')) {
    return { success: false, message: 'Not Authorized' }
  }

  try {
    const res = await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    })
    
    // Revalidate the path to refresh the UI
    revalidatePath('/admin')
    
    return { 
      success: true, 
      message: `User role updated to ${role}`,
      metadata: res.publicMetadata 
    }
  } catch (err) {
    console.error('Error setting role:', err)
    return { 
      success: false, 
      message: 'Failed to update user role'
    }
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient()
  const userId = formData.get('id') as string

  // Check that the user trying to remove the role is an admin
  if (!checkRole('admin')) {
    return { success: false, message: 'Not Authorized' }
  }

  try {
    const res = await client.users.updateUserMetadata(userId, {
      publicMetadata: { role: null },
    })
    
    // Revalidate the path to refresh the UI
    revalidatePath('/admin')
    
    return { 
      success: true, 
      message: 'User role removed',
      metadata: res.publicMetadata 
    }
  } catch (err) {
    console.error('Error removing role:', err)
    return { 
      success: false, 
      message: 'Failed to remove user role'
    }
  }
}