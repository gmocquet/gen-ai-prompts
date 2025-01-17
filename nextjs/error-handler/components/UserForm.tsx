'use client'

import React, { useState, useTransition, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, UserFormData } from '../lib/schema'
import { submitUserData } from '../lib/actions'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ErrorTypeGuards } from '../lib/types'

export function UserForm() {
  const [clientValidation, setClientValidation] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [submissionTime, setSubmissionTime] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  
  const form = useForm<UserFormData>({
    resolver: clientValidation ? zodResolver(userSchema) : undefined,
    defaultValues: {
      name: '',
      email: 'jdoe@acme.com',
      age: 25,
      bio: 'I\'m an American',
    },
  })

  const onSubmit = useCallback(async (data: UserFormData) => {
    setServerError(null)
    setSubmissionTime(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            formData.append(key, value.toString())
          }
        })
        const result = await submitUserData(formData)

        if (result.success) {
          setSubmissionTime(new Date().toISOString())
          form.reset()
        } else {
          if (ErrorTypeGuards.isZodValidationError(result.error)) {
            Object.entries(result.error.errors).forEach(([key, value]) => {
              form.setError(key as keyof UserFormData, { type: 'server', message: value })
            })
          } else if (
            ErrorTypeGuards.isDatabaseError(result.error) ||
            ErrorTypeGuards.isPermissionError(result.error) ||
            ErrorTypeGuards.isUnknownError(result.error)
          ) {
            setServerError(result.error.message)
          }
        }
      } catch (error) {
        setServerError('An unexpected error occurred. Please try again. ' + error.toString())
      }
    })
  }, [form])

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="client-validation"
                checked={clientValidation}
                onCheckedChange={setClientValidation}
              />
              <label htmlFor="client-validation">Enable client-side validation</label>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        </Form>
        {serverError && (
          <Alert className="mt-4">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}
        {submissionTime && (
          <Alert className="mt-4">
            <AlertDescription>
              Form submitted successfully at: {new Date(submissionTime).toLocaleString()}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

