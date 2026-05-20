import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { plans } from "@fitness/db";
import { withTenantScope } from "@/lib/db";
import { getCurrentTenantId } from "@/lib/tenant";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlanAction } from "../_actions";

export default async function EditPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenantId = await getCurrentTenantId();
  const plan = await withTenantScope(tenantId, async (db) => {
    const [p] = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
    return p ?? null;
  });
  if (!plan) notFound();

  return (
    <form
      action={async (fd) => {
        "use server";
        await updatePlanAction(id, fd);
      }}
      className="max-w-md space-y-4"
    >
      <h1 className="text-xl font-semibold">Edit plan</h1>
      <Field label="Name" name="name" defaultValue={plan.name} required />
      <Field
        label="Price (minor units)"
        name="priceMinor"
        type="number"
        defaultValue={String(plan.priceMinor)}
        required
      />
      <Field label="Currency" name="currency" defaultValue={plan.currency} />
      <Field
        label="Duration (days)"
        name="durationDays"
        type="number"
        defaultValue={String(plan.durationDays)}
        required
      />
      <Field
        label="Features (comma separated)"
        name="features"
        defaultValue={(plan.features ?? []).join(", ")}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="active"
          defaultChecked={plan.active}
          className="h-4 w-4 accent-amber"
        />
        Active
      </label>
      <Button type="submit">Save changes</Button>
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
