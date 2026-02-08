import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qixvkbivnohcngaicsgy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeHZrYml2bm9oY25nYWljc2d5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NjUyODMsImV4cCI6MjA4NjE0MTI4M30.yCLN7qQasQoQT7wzZzyKip1JVgkcjOW4wOpDWKhpCh8'

export const supabase = createClient(supabaseUrl, supabaseKey)
