import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMemberAction } from "../_actions";

export default function NewMemberPage() {
  return (
    <form
      action={async (fd) => {
        "use server";
        await createMemberAction(fd);
      }}
      className="max-w-md space-y-4"
    >
      <h1 className="text-xl font-semibold">New member</h1>
      <Field label="Full name" name="fullName" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Phone" name="phone" />
      <Field label="Birthdate" name="birthdate" type="date" />
      <Button type="submit">Create</Button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
