
import React from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

// Define form schema
const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

export type FormValues = z.infer<typeof formSchema>;

interface AuthFormProps {
  isLogin: boolean;
  isLoading: boolean;
  onSubmit: (values: FormValues) => Promise<void>;
}

export const AuthForm: React.FC<AuthFormProps> = ({ isLogin, isLoading, onSubmit }) => {
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="flex items-center border rounded-md focus-within:ring-2 focus-within:ring-ring">
                  <Mail className="ml-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="name@example.com" 
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          className="w-full bg-brand-burgundy hover:bg-brand-burgundy/90" 
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
              {isLogin ? "Logging in..." : "Signing up..."}
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {isLogin ? "Log In" : "Sign Up"}
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
};
