"use client"

import { useState, useEffect } from "react"
import * as db from "@/lib/database"

export function useProfiles() {
  const [data, setData] = useState<db.Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getProfiles()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error }
}

export function useProjects() {
  const [data, setData] = useState<db.Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getProjects()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error, refetch: () => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getProjects()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  } }
}

export function useAnnouncements() {
  const [data, setData] = useState<db.Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getAnnouncements()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error, refetch: () => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getAnnouncements()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  } }
}

export function useCalendarEvents() {
  const [data, setData] = useState<db.CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getCalendarEvents()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error }
}

export function useOpportunities() {
  const [data, setData] = useState<db.Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getOpportunities()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error }
}

export function useResources() {
  const [data, setData] = useState<db.Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetch() {
      try {
        setLoading(true)
        const { data, error } = await db.getResources()
        if (error) throw error
        setData(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return { data, loading, error }
}

export function useNotifications(userId: string | null) {
  const [data, setData] = useState<db.Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!userId) {
      setData([])
      setLoading(false)
      setUnreadCount(0)
      return
    }

    async function fetch() {
      try {
        setLoading(true)
        const [notificationsResult, countResult] = await Promise.all([
          db.getNotifications(userId),
          db.getUnreadNotificationsCount(userId),
        ])
        if (notificationsResult.error) throw notificationsResult.error
        setData(notificationsResult.data || [])
        setUnreadCount(countResult.count || 0)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }
    fetch()
    
    // Refresh every 30 seconds
    const interval = setInterval(fetch, 30000)
    return () => clearInterval(interval)
  }, [userId])

  return { data, loading, error, unreadCount, refetch: async () => {
    if (!userId) return
    try {
      setLoading(true)
      const [notificationsResult, countResult] = await Promise.all([
        db.getNotifications(userId),
        db.getUnreadNotificationsCount(userId),
      ])
      if (notificationsResult.error) throw notificationsResult.error
      setData(notificationsResult.data || [])
      setUnreadCount(countResult.count || 0)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  } }
}

