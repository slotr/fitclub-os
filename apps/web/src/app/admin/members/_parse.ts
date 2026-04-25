import { createMemberInput } from "@fitness/api";

export function parseCreateMember(formData: FormData) {
  return createMemberInput.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
    birthdate: formData.get("birthdate") || undefined,
    gender: formData.get("gender") || undefined,
  });
}
