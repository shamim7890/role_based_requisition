// @/middleware.ts (update the existing file)
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isAdminRoute = createRouteMatcher(["/admin(.*)"])
const isApproverRoute = createRouteMatcher(["/approvals(.*)"])
const isRequisitionNewRoute = createRouteMatcher(["/requisitions/new"])
const isRequisitionListRoute = createRouteMatcher(["/requisitions"])
const isAdminRequisitionNewRoute = createRouteMatcher(["/execories/new"])
const isAdminRequisitionListRoute = createRouteMatcher(["/execories"])
const isProfileRoute = createRouteMatcher(["/profile(.*)"])
const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])

export default clerkMiddleware(async (auth, req) => {
    const { userId, sessionClaims } = await auth()

    const isPublicRoute = req.nextUrl.pathname === '/' || 
                         req.nextUrl.pathname.startsWith('/sign-in') || 
                         req.nextUrl.pathname.startsWith('/sign-up')

    if (!userId && !isPublicRoute) {
        return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    if (userId && (isProfileRoute(req) || isDashboardRoute(req))) {
        return NextResponse.next()
    }

    if (userId) {
        const role = sessionClaims?.metadata?.role as string

        if (role === "admin") {
            return NextResponse.next()
        }

        const approverRoles = ['technical_manager_c', 'technical_manager_m', 'senior_assistant_director', 'quality_assurance_manager']
        
        if (approverRoles.includes(role)) {
            if (isAdminRoute(req)) {
                return NextResponse.redirect(new URL("/approvals", req.url))
            }
            if (isRequisitionNewRoute(req) || isAdminRequisitionNewRoute(req)) {
                return NextResponse.redirect(new URL("/execories", req.url))
            }
            return NextResponse.next()
        }

        if (role === "analyst") {
            if (isAdminRoute(req) || isApproverRoute(req)) {
                return NextResponse.redirect(new URL("/", req.url))
            }
            if (isRequisitionNewRoute(req) || isRequisitionListRoute(req) ||
                isAdminRequisitionNewRoute(req) || isAdminRequisitionListRoute(req)) {
                return NextResponse.next()
            }
            return NextResponse.next()
        }

        if (isAdminRoute(req) || isApproverRoute(req) || 
            isRequisitionNewRoute(req) || isRequisitionListRoute(req) ||
            isAdminRequisitionNewRoute(req) || isAdminRequisitionListRoute(req)) {
            return NextResponse.redirect(new URL("/", req.url))
        }
    }

    return NextResponse.next()
})

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
}