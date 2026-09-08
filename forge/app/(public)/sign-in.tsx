import { View, Text } from 'react-native'
import {Controller, useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import React from 'react'
import { signInFormValues, signInSchema } from '@/lib/validations/auth-validation'

export default function SignIn() {
const {control, handleSubmit, formState:{errors}} = useForm<signInFormValues>({
    defaultValues:{
        email: "",
        password: ""
    }, 
    mode: "onTouched",
    resolver: zodResolver(signInSchema),
    shouldFocusError: false
})
  return (
    <View>
      <Text>sign-in</Text>
    </View>
  )
} 