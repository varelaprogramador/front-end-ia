import { LoginForm } from "@/components/login-form"
import { redirect } from "next/navigation"


export default function HomePage() {
  redirect("/workspace")
}
