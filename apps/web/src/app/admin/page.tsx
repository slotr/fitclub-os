import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Active members", value: "—" },
          { label: "MRR", value: "—" },
          { label: "Today check-ins", value: "—" },
          { label: "Churn (30d)", value: "—" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader>
              <CardTitle className="text-xs text-neutral-500">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">{kpi.value}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
