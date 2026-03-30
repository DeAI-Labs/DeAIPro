// frontend/lib/authContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth, googleProvider } from './firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signInWithGoogle: () => Promise<string | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => 'Authentication is not ready',
  signUp: async () => 'Authentication is not ready',
  signInWithGoogle: async () => 'Authentication is not ready',
  signOut: async () => {},
  resetPassword: async () => 'Authentication is not ready',
})

const mapFirebaseError = (error: unknown) => {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? (error as any).code
      : null

  switch (code) {
    case 'auth/user-not-found':
      return 'No account found with this email'
    case 'auth/wrong-password':
      return 'Incorrect password'
    case 'auth/email-already-in-use':
      return 'An account already exists with this email'
    case 'auth/weak-password':
      return 'Password must be at least 6 characters'
    case 'auth/invalid-email':
      return 'Please enter a valid email address'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later'
    case 'auth/network-request-failed':
      return 'Network error. Check your connection'
    default:
      return 'Authentication error. Please try again'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const authNotConfiguredMessage =
    'Authentication is not configured. Please set Firebase environment variables.'

  const signIn = async (email: string, password: string) => {
    if (!auth) return authNotConfiguredMessage

    try {
      await signInWithEmailAndPassword(auth, email, password)
      return null
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!auth) return authNotConfiguredMessage

    try {
      await createUserWithEmailAndPassword(auth, email, password)
      return null
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) return authNotConfiguredMessage

    try {
      await signInWithPopup(auth, googleProvider)
      return null
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const resetPassword = async (email: string) => {
    if (!auth) return authNotConfiguredMessage

    try {
      await sendPasswordResetEmail(auth, email)
      return 'Reset email sent'
    } catch (error) {
      return mapFirebaseError(error)
    }
  }

  const signOut = async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, signOut, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
