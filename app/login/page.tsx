"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { signIn, signOut, useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminContacts, setAdminContacts] = useState<string[]>([])
  const { data: session, isPending } = useSession()
  const router = useRouter()

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push("/")
    }
  }, [session, isPending, router])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    setAdminContacts([])

    try {
      // Sign in with Google - this will redirect to Google OAuth
      await signIn.social({
        provider: "google",
        callbackURL: "/login",
      })
    } catch (err: any) {
      setLoading(false)
      setError(err.message || "Authentication failed. Please try again.")
    }
  }

  // Check user registration after session is available
  useEffect(() => {
    const checkUserRegistration = async () => {
      if (session?.user?.email && !loading) {
        try {
          const checkResponse = await fetch("/api/auth/check-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: session.user.email }),
          })

          const checkData = await checkResponse.json()

          if (!checkData.exists) {
            // User is not registered
            setError("You are not registered. Please contact:")
            setAdminContacts(checkData.admins || [])
            
            // Sign out the user since they're not registered
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.refresh()
                },
              },
            })
          } else {
            // User is registered, redirect to portal
            router.push("/")
          }
        } catch (err: any) {
          console.error("Error checking user registration:", err)
        }
      }
    }

    checkUserRegistration()
  }, [session?.user?.email, loading, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <svg className="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Animated magic sparkles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-60"
            initial={{
              x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0,
              y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0,
              scale: 0,
            }}
            animate={{
              scale: [0, 1, 0],
              y: [null, (Math.random() - 0.5) * 100],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="border-2 border-purple-200 shadow-2xl bg-white/90 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-4 pb-8 pt-8 px-6">
            {/* Wizard hat icon with animation */}
            <motion.div
              className="flex justify-center"
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <div className="relative">
                <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <motion.div
                  className="absolute -top-2 -right-2"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to the Harry Botter Portal
            </h1>
            <div className="text-base text-gray-600 space-y-2">
              <p>(also known as the TechTool Portal)</p>
              <p className="mt-3">
                Here, you can submit your wishes — whether it&apos;s a new feature request or a pesky bug — and let our magical wizard handle it for you.
              </p>
              <p className="mt-3 font-medium text-gray-700">
                Before you begin, please log in using your Foodstyles account below.
              </p>
            </div>
          </div>

          <div className="space-y-4 px-6 pb-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <p className="text-red-600 font-medium mb-2">{error}</p>
                {adminContacts.length > 0 && (
                  <ul className="list-disc list-inside space-y-1">
                    {adminContacts.map((admin, index) => (
                      <li key={index} className="text-red-600">- {admin}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}

            <button
              className="w-full gap-3 h-12 text-base font-medium border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
              onClick={handleGoogleSignIn}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 256 262"
                    className="flex-shrink-0"
                  >
                    <path
                      fill="#4285F4"
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    />
                    <path
                      fill="#34A853"
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    />
                    <path
                      fill="#FBBC05"
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                    />
                    <path
                      fill="#EB4335"
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    />
                  </svg>
                  Sign in with Google
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
