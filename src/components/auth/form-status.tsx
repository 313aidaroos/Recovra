import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AuthFormState } from "@/lib/auth/actions";

export function FormStatus({ state }: { state: AuthFormState }) {
  if (state.error) {
    return <p className="form-status error" role="alert"><AlertTriangle size={14}/> {state.error}</p>;
  }
  if (state.message) {
    return <p className="form-status success" role="status"><CheckCircle2 size={14}/> {state.message}</p>;
  }
  return null;
}
