'use client';

import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/providers/AuthProvider';

// ─── Validation schema ────────────────────────────────────────────────────────
const formSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }),
  pin: z.string().min(1, { message: 'PIN is required' }),
  remember: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Internal Component ───────────────────────────────────────────────────────

function SignInForm() {
  const { login, loginError, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPin, setShowPin] = useState(false);

  // If the user is already authenticated, redirect immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/member');
    }
  }, [isAuthenticated, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', pin: '', remember: false },
  });

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      await login(values.email, values.pin);
      // Redirect to where the user was trying to go, or /member as default
      const next = searchParams.get('next') ?? '/member';
      router.replace(next);
    } catch {
      // loginError in AuthProvider is already set — displayed below the form
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className='bg-background text-foreground min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden'>
      {/* Animated background — purely decorative */}
      <div className='fixed inset-0 pointer-events-none overflow-hidden'>
        <div
          className='absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] animate-pulse'
          style={{ animationDuration: '8s' }}
        />
        <div
          className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse'
          style={{ animationDuration: '10s', animationDelay: '2s' }}
        />
        <div
          className='absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] animate-pulse'
          style={{ animationDuration: '12s', animationDelay: '4s' }}
        />

        {/* Surveillance grid */}
        <div className='absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:50px_50px]' />

        {/* Hex pattern */}
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%2306b6d4' stroke-width='1'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Scanline */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-scan' />

        {/* Vignette */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background' />
      </div>

      {/* Animation keyframes — scoped to this page */}
      <style jsx>{`
        @keyframes scan {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
        .animate-scan {
          animation: scan 8s linear infinite;
        }
      `}</style>

      {/* ── Card ── */}
      <div className='w-full max-w-md relative z-10'>
        {/* Branding */}
        <div className='text-center mb-8'>
          <Link href='/' className='inline-flex items-center space-x-3 mb-4'>
            <div className='relative'>
              <ShieldAlert className='text-cyan-400 text-3xl' />
              <div className='absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse' />
            </div>
            <div>
              <span className='text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent'>
                Loctiva
              </span>
              <div className='text-[10px] text-gray-500 font-mono tracking-wider'>
                OS COMMAND & CONTROL
              </div>
            </div>
          </Link>
          <h1 className='font-bold'>Welcome Back</h1>
          <p className='text-gray-400'>Sign in to access your command center</p>
        </div>

        {/* Form card */}
        <div className='bg-card/50 backdrop-blur-xl p-8 rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6' noValidate>
              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='user@example.com'
                        autoComplete='email'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* PIN */}
              <FormField
                control={form.control}
                name='pin'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN</FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type={showPin ? 'text' : 'password'}
                          placeholder='••••••••'
                          autoComplete='current-password'
                          className='pr-10'
                          {...field}
                        />
                        <button
                          type='button'
                          onClick={() => setShowPin((v) => !v)}
                          className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors'
                          tabIndex={-1}
                          aria-label={showPin ? 'Hide password' : 'Show password'}
                        >
                          {showPin ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Remember me + forgot password */}
              <div className='flex items-center justify-between'>
                <FormField
                  control={form.control}
                  name='remember'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-center space-x-2 space-y-0'>
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <FormLabel className='text-sm font-normal cursor-pointer'>
                        Remember me
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <Link href='#' className='text-sm text-blue-400 hover:text-blue-300'>
                  Forgot password?
                </Link>
              </div>

              {/* Server-side auth error — shown inline, never in an alert() */}
              {loginError && (
                <div className='rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400'>
                  {loginError}
                </div>
              )}

              {/* Submit */}
              <Button type='submit' className='w-full' disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <span className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                    Signing in…
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Footer links */}
        <p className='mt-6 text-center text-sm text-gray-400'>
          Don&apos;t have an account?{' '}
          <Link href='/sign-up' className='text-blue-400 hover:text-blue-300 font-medium'>
            Sign up for free
          </Link>
        </p>
        <div className='mt-4 text-center'>
          <Link
            href='/'
            className='text-sm text-gray-500 hover:text-gray-400 inline-flex items-center space-x-1'
          >
            <ArrowLeft />
            <span>Back to home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-background flex items-center justify-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500'></div>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
