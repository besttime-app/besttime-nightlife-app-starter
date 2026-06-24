import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AdminPasswordForm } from '@/components/admin/AdminPasswordForm'
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel'
import { AdminWarningModal } from '@/components/admin/AdminWarningModal'
import { isAdminPasswordConfigured, isAdminSessionValid } from '@/lib/admin/auth'
import { shouldIndexPublicPages } from '@/lib/config'
import { getVenueRepository } from '@/lib/data/repository'

export default async function AdminPage() {
  const protectedByPassword = isAdminPasswordConfigured()
  const sessionValid = await isAdminSessionValid()
  const repository = getVenueRepository()

  if (protectedByPassword && !sessionValid) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 p-4 text-slate-950">
        <AdminPasswordForm />
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-8 text-slate-950">
      <AdminWarningModal protectedByPassword={protectedByPassword} />
      <div className="mx-auto w-full max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 underline-offset-2 hover:text-slate-950 hover:underline">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Back to app
        </Link>
        <div className="mt-6">
          <AdminSettingsPanel
            mode={repository.mode}
            protectedByPassword={protectedByPassword}
            indexingEnabled={shouldIndexPublicPages()}
          />
        </div>
      </div>
    </main>
  )
}
