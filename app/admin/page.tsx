import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole } from './_actions'

// Form submission helpers
async function makeAdmin(formData: FormData) {
  'use server'
  await setRole(formData)
}

async function makeAnalyst(formData: FormData) {
  'use server' 
  await setRole(formData)
}

async function makeTechnicalManagerChemical(formData: FormData) {
  'use server' 
  await setRole(formData)
}

async function makeTechnicalManagerMicroBiology(formData: FormData) {
  'use server' 
  await setRole(formData)
}

async function makeSeniorAssistantDirector(formData: FormData) {
  'use server' 
  await setRole(formData)
}

async function makeQualityAssuranceManager(formData: FormData) {
  'use server' 
  await setRole(formData)
}

async function removeUserRole(formData: FormData) {
  'use server'
  await removeRole(formData)
}

export default async function AdminDashboard() {
  if (!checkRole('admin')) {
    redirect('/')
  }

  const client = await clerkClient()

  // Fetch all users without search query
  const { data: users, totalCount } = await client.users.getUserList({
    limit: 100, // Adjust this number based on your needs
  })

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Admin Dashboard</h1>
        <p className="text-gray-100">
          Manage user roles and permissions for your application.
        </p>
        <p className="text-sm text-gray-100 mt-2">
          Total Users: {totalCount}
        </p>
      </div>

      {users.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.imageUrl ? (
                          <img className="h-10 w-10 rounded-full mr-3" src={user.imageUrl} alt={`${user.firstName} ${user.lastName}`} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                            <span className="text-gray-500 font-medium">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {user.id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)?.emailAddress}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.publicMetadata.role ? (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${user.publicMetadata.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'}`}>
                          {user.publicMetadata.role as string}
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          None
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <form action={makeAdmin}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="role" value="admin" />
                          <button 
                            type="submit" 
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Admin
                          </button>
                        </form>

                        <form action={makeAnalyst}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="role" value="analyst" />
                          <button 
                            type="submit" 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            Analyst
                          </button>
                        </form>

                        <form action={makeTechnicalManagerChemical}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="role" value="technical_manager_c" />
                          <button 
                            type="submit" 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            TM(C)
                          </button>
                        </form>

                        <form action={makeTechnicalManagerMicroBiology}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="role" value="technical_manager_m" />
                          <button 
                            type="submit" 
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            TM(M)
                          </button>
                        </form>

                        <form action={makeSeniorAssistantDirector}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="role" value="senior_assistant_director" />
                          <button 
                            type="submit" 
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            SAD
                          </button>
                        </form>

                        <form action={makeQualityAssuranceManager}>
                          <input type="hidden" name="id" value={user.id} />
                          <input type="hidden" name="role" value="quality_assurance_manager" />
                          <button 
                            type="submit" 
                            className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded text-sm transition-colors"
                          >
                            QA Manager
                          </button>
                        </form>

                        <form action={removeUserRole}>
                          <input type="hidden" name="id" value={user.id} />
                          <button 
                            type="submit" 
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
                          >
                            Remove
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600">No users found in the system</p>
        </div>
      )}
    </div>
  )
}