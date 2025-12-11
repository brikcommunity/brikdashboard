"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Upload, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  currentImage?: string | null
  onImageUploaded: (url: string) => void
  onImageRemoved?: () => void
  className?: string
  size?: "sm" | "md" | "lg"
}

export function ImageUpload({
  currentImage,
  onImageUploaded,
  onImageRemoved,
  className,
  size = "md",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32",
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File size must be less than 5MB')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to server
    setUploading(true)
    try {
      // Get the session token from Supabase
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated. Please log in.')
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const { url } = await response.json()
      onImageUploaded(url)
    } catch (error: any) {
      console.error('Error uploading image:', error)
      alert(error.message || 'Failed to upload image')
      setPreview(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onImageRemoved?.()
  }

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <Avatar className={cn("border-4 border-border", sizeClasses[size])}>
          <AvatarImage src={preview || undefined} />
          <AvatarFallback className="bg-[#AEC6FF] text-xl font-bold">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              "?"
            )}
          </AvatarFallback>
        </Avatar>
        {preview && onImageRemoved && (
          <button
            onClick={handleRemove}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-border bg-red-500 text-white shadow-[2px_2px_0px_0px_#1A1A1A] hover:bg-red-600"
            type="button"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="border-2 shadow-[2px_2px_0px_0px_#1A1A1A] hover:shadow-[4px_4px_0px_0px_#1A1A1A]"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {preview ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Max 5MB • JPEG, PNG, GIF, WebP
        </p>
      </div>
    </div>
  )
}

