import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPlanAction } from "../_actions";

export default function NewPlanPage() {
  return (
    <form
      action={async (fd) => {
        "use server";
        await createPlanAction(fd);
      }}
      className="max-w-md space-y-4"
    >
      <h1 className="text-xl font-semibold">New plan</h1>
      <Field label="Name" name="name" required />
      <Field label="Price (minor units)" name="priceMinor" type="number" required />
      <Field label="Currency" name="currency" defaultValue="USD" />
      <Field label="Duration (days)" name="durationDays" type="number" required />
      <Field label="Features (comma separated)" name="features" />
      <Button type="submit">Create</Button>
    </form>
  );
}

function Field(props: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={props.name}>{props.label}</Label>
      <Input
        id={props.name}
        name={props.name}
        type={props.type ?? "text"}
        required={props.required}
        defaultValue={props.defaultValue}
      />
    </div>
  );
}
