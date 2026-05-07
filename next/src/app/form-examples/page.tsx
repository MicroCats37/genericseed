"use client";

import React from "react";
import { z } from "zod";
import { GenericForm } from "@/components/genericForm/GenericForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { User, Lock, Mail, Phone, MapPin, ShieldCheck, CreditCard } from "lucide-react";
import { notify } from "@/errors";

/**
 * 📝 FORM EXAMPLES GALLERY
 * Following .lab/specs/nextjs/forms/SPEC.md
 */

// --- 1. LOGIN FORM (MODE 1: MANUAL - PRODUCTION STANDARD) ---
const LoginFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginData = z.infer<typeof LoginFormSchema>;

const LoginFormExample = () => {
  const handleSubmit = async (data: LoginData) => {
    console.log("🚀 Login Payload:", data);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulating API
    notify.success("Logged in successfully!");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" /> Mode 1: Manual Login
        </CardTitle>
        <CardDescription>
          Standard production implementation with full layout control.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GenericForm schema={LoginFormSchema} onSubmit={handleSubmit}>
          {({ methods, isSubmitting }) => (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    {...methods.register("email")}
                    className="pl-9"
                    placeholder="name@example.com"
                  />
                </div>
                {methods.formState.errors.email && (
                  <p className="text-xs text-destructive">{methods.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    type="password"
                    {...methods.register("password")}
                    className="pl-9"
                    placeholder="••••••••"
                  />
                </div>
                {methods.formState.errors.password && (
                  <p className="text-xs text-destructive">{methods.formState.errors.password.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Authenticating..." : "Sign In"}
              </Button>
            </div>
          )}
        </GenericForm>
      </CardContent>
    </Card>
  );
};

// --- 2. REGISTER FORM (MODE 2: AUTOMATIC - CONFIG DRIVEN) ---
const RegisterFormSchema = z.object({
  fullName: z.string().min(3, "Full name required"),
  username: z.string().min(3, "Username required"),
  phone: z.string().optional(),
  type: z.enum(["individual", "business"]),
});

type RegisterData = z.infer<typeof RegisterFormSchema>;

const AutomaticFormExample = () => {
  const handleSubmit = async (data: RegisterData) => {
    console.log("📦 Auto Form data:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    notify.success("Registration config received!");
  };

  const fields = [
    { name: "fullName", label: "Full Name", type: "text", placeholder: "John Doe", icon: User },
    { name: "username", label: "Username", type: "text", placeholder: "jdoe99" },
    { name: "phone", label: "Phone Number", type: "text", placeholder: "+51 999...", icon: Phone },
    { 
      name: "type", 
      label: "Account Type", 
      type: "select", 
      options: [
        { label: "Individual", value: "individual" },
        { label: "Business", value: "business" }
      ] 
    },
  ] as const;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" /> Mode 2: Auto Register
        </CardTitle>
        <CardDescription>
          Config-driven rendering for quick admin tools or prototyping.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GenericForm 
          schema={RegisterFormSchema} 
          onSubmit={handleSubmit} 
          fields={fields as any}
          submitButtonText="Create Account"
        />
      </CardContent>
    </Card>
  );
};

// --- 3. PROFILE SECTIONS (MODE 3: SECTIONS - ADVANCED LAYOUT) ---
const ProfileFormSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  city: z.string(),
  address: z.string(),
  cardNumber: z.string().length(16, "Must be 16 digits"),
  cvv: z.string().length(3),
});

type ProfileData = z.infer<typeof ProfileFormSchema>;

const SectionsFormExample = () => {
  const handleSubmit = async (data: ProfileData) => {
    console.log("👔 Profile data:", data);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    notify.success("Profile updated!");
  };

  const sections = [
    {
      title: "Personal Information",
      description: "Basic identity details",
      icon: User,
      fields: [
        { name: "firstName", label: "First Name", type: "text", containerClassName: "col-span-6" },
        { name: "lastName", label: "Last Name", type: "text", containerClassName: "col-span-6" },
      ]
    },
    {
      title: "Address Details",
      description: "Where you currently live",
      icon: MapPin,
      fields: [
        { name: "city", label: "City", type: "text", containerClassName: "col-span-12" },
        { name: "address", label: "Street Address", type: "textarea", containerClassName: "col-span-12" },
      ]
    },
    {
      title: "Billing",
      description: "Payment method configuration",
      icon: CreditCard,
      fields: [
        { name: "cardNumber", label: "Card Number", type: "text", containerClassName: "col-span-8" },
        { name: "cvv", label: "CVV", type: "text", containerClassName: "col-span-4" },
      ]
    }
  ] as any;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" /> Mode 3: Form Sections
        </CardTitle>
        <CardDescription>
          Multi-card grouped layout for complex dashboard data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GenericForm 
          schema={ProfileFormSchema} 
          onSubmit={handleSubmit} 
          formSections={sections}
          submitButtonText="Update All Sections"
        />
      </CardContent>
    </Card>
  );
};

export default function FormExamplesPage() {
  return (
    <div className="container mx-auto p-12 space-y-12 min-h-screen bg-slate-50/50">
      <div className="space-y-2 border-b pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight">GenericForm Architecture</h1>
        <p className="text-muted-foreground text-lg">
          Mastering the 4 rendering modes defined in <code>.lab/specs/nextjs/forms/SPEC.md</code>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-8">
          <LoginFormExample />
          <AutomaticFormExample />
        </div>
        <div>
          <SectionsFormExample />
        </div>
      </div>
    </div>
  );
}
