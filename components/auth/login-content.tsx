"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, User, Lock, ArrowRight, Loader2, CheckCircle2, Blocks } from "lucide-react"
import { signInWithUsername } from "@/lib/auth"

export function LoginContent() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { username?: string; password?: string } = {}
    if (!username) {
      newErrors.username = "Username is required"
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
      newErrors.username = "Username can only contain letters, numbers, and underscores"
    }
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})

    try {
      const { data, error } = await signInWithUsername(username, password)

      if (error) {
        setErrors({ username: error, password: error })
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      setIsSuccess(true)

      // Redirect after success animation
      setTimeout(() => {
        router.push("/")
        router.refresh()
      }, 1000)
    } catch (err: any) {
      setErrors({ username: err.message || "An error occurred" })
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f4eb] flex flex-col lg:flex-row">
      {/* Left Panel - Branding */}
      <div className="lg:w-1/2 bg-[#3a5fcd] p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-20 -left-20 w-64 h-64 bg-[#5c7aea] border-4 border-black transform rotate-12 animate-[float_6s_ease-in-out_infinite]"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="absolute top-1/3 -right-16 w-48 h-48 bg-[#aec6ff] border-4 border-black transform -rotate-12 animate-[float_8s_ease-in-out_infinite]"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-20 left-1/4 w-32 h-32 bg-[#e7b75f] border-4 border-black transform rotate-45 animate-[float_7s_ease-in-out_infinite]"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute -bottom-10 right-1/3 w-40 h-40 bg-white border-4 border-black transform -rotate-6 animate-[float_5s_ease-in-out_infinite]"
            style={{ animationDelay: "0.5s" }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center">
              <Blocks className="w-6 h-6 text-[#3a5fcd]" />
            </div>
            <span className="text-2xl font-bold text-white font-mono">BRIK</span>
          </div>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 my-12 lg:my-0">
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Build.
            <br />
            Learn.
            <br />
            <span className="text-[#e7b75f]">Grow.</span>
          </h1>
          <p className="text-lg text-white/90 max-w-md">
            Join a community of student builders creating the future. Access resources, opportunities, and connect with
            peers.
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10 hidden lg:flex gap-8">
          <div className="bg-white/10 backdrop-blur border-2 border-white/30 p-4">
            <p className="text-3xl font-bold text-white font-mono">500+</p>
            <p className="text-white/80 text-sm">Active Builders</p>
          </div>
          <div className="bg-white/10 backdrop-blur border-2 border-white/30 p-4">
            <p className="text-3xl font-bold text-white font-mono">50+</p>
            <p className="text-white/80 text-sm">Projects Launched</p>
          </div>
          <div className="bg-white/10 backdrop-blur border-2 border-white/30 p-4">
            <p className="text-3xl font-bold text-white font-mono">100+</p>
            <p className="text-white/80 text-sm">Opportunities</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="lg:w-1/2 p-8 lg:p-12 flex items-center justify-center">
        <div
          className={`w-full max-w-md transition-all duration-500 ${isSuccess ? "scale-95 opacity-0" : "scale-100 opacity-100"}`}
        >
          {/* Success Overlay */}
          {isSuccess && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f7f4eb]">
              <div className="text-center animate-[scaleIn_0.3s_ease-out]">
                <div className="w-24 h-24 bg-green-500 border-4 border-black shadow-[6px_6px_0px_0px_#000] mx-auto mb-6 flex items-center justify-center animate-[bounce_0.5s_ease-out]">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
                <p className="text-gray-600">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Enter your credentials to access your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className={`text-sm font-medium transition-colors duration-200 ${focusedField === "username" ? "text-[#3a5fcd]" : "text-gray-700"}`}
              >
                Username
              </Label>
              <div className="relative group">
                <div
                  className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r-2 border-black transition-all duration-300 ${
                    focusedField === "username" ? "bg-[#3a5fcd]" : errors.username ? "bg-red-100" : "bg-[#aec6ff]"
                  }`}
                >
                  <User
                    className={`w-5 h-5 transition-colors duration-300 ${focusedField === "username" ? "text-white" : "text-gray-700"}`}
                  />
                </div>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase())
                    if (errors.username) setErrors({ ...errors, username: undefined })
                  }}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  className={`pl-16 h-14 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 focus:shadow-[2px_2px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] ${
                    errors.username ? "border-red-500 shadow-[4px_4px_0px_0px_#dc2626]" : ""
                  }`}
                />
                {/* Animated underline */}
                <div
                  className={`absolute bottom-0 left-12 h-0.5 bg-[#3a5fcd] transition-all duration-300 ${
                    focusedField === "username" ? "w-[calc(100%-48px)]" : "w-0"
                  }`}
                />
              </div>
              {errors.username && <p className="text-red-500 text-sm animate-[shake_0.3s_ease-in-out]">{errors.username}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className={`text-sm font-medium transition-colors duration-200 ${focusedField === "password" ? "text-[#3a5fcd]" : "text-gray-700"}`}
              >
                Password
              </Label>
              <div className="relative group">
                <div
                  className={`absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center border-r-2 border-black transition-all duration-300 ${
                    focusedField === "password" ? "bg-[#3a5fcd]" : errors.password ? "bg-red-100" : "bg-[#aec6ff]"
                  }`}
                >
                  <Lock
                    className={`w-5 h-5 transition-colors duration-300 ${focusedField === "password" ? "text-white" : "text-gray-700"}`}
                  />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      handleSubmit(e as any)
                    }
                  }}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className={`pl-16 pr-12 h-14 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all duration-200 focus:shadow-[2px_2px_0px_0px_#000] focus:translate-x-[2px] focus:translate-y-[2px] ${
                    errors.password ? "border-red-500 shadow-[4px_4px_0px_0px_#dc2626]" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                {/* Animated underline */}
                <div
                  className={`absolute bottom-0 left-12 h-0.5 bg-[#3a5fcd] transition-all duration-300 ${
                    focusedField === "password" ? "w-[calc(100%-48px)]" : "w-0"
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm animate-[shake_0.3s_ease-in-out]">{errors.password}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  className="border-2 border-black data-[state=checked]:bg-[#3a5fcd] data-[state=checked]:border-[#3a5fcd]"
                />
                <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                  Remember me
                </Label>
              </div>
              <a
                href="#"
                className="text-sm text-[#3a5fcd] hover:text-[#5c7aea] font-medium transition-colors relative group"
              >
                Forgot password?
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#3a5fcd] group-hover:w-full transition-all duration-300" />
              </a>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#3a5fcd] hover:bg-[#5c7aea] text-white border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-150 text-lg font-bold disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-[#f7f4eb] text-gray-500 text-sm">Or continue with</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] hover:shadow-[1px_1px_0px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-150"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          {/* Note: Only admins can create new members */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Need an account? Contact an administrator.
          </p>
        </div>
      </div>

      {/* Custom keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(var(--rotation, 12deg));
          }
          50% {
            transform: translateY(-20px) rotate(var(--rotation, 12deg));
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
