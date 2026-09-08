import {z} from "zod"

export const signInSchema = z.object({
    email: z.string().trim().min(1, "Email is required").pipe(z.email("Enter a valid email address")),
    password: z.string().min(1, "Password is required").min(8, "Password must be atleast 8 characters"),

})

export const signUpSchema = z.object({
    email: z.string().trim().min(1, "Email is required"),
    password: z.string().min(1, "PAssword is required").min(8, "Password must be atleast 8 characters"),
    fullName: z.string().trim().min(1, "Full name is required").min(2, "Full name must be atleast 2 characters")
})

export type signInFormValues = z.infer<typeof signInSchema>
export type signUpFormValues = z.infer<typeof signUpSchema>