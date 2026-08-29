import { Card, CardBody, CardHeader } from "@/components/ui";
import { SettingsEditor } from "@/components/dashboard/settings-editor";
import { demoAudits, demoServices, demoSettings } from "@/lib/demo-data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = demoSettings;
  const services = demoServices;
  const audits = demoAudits;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Billing, workflow and document settings apply across the platform.
        </p>
      </div>

      <SettingsEditor settings={settings} />

      <Card>
        <CardHeader title="Services and rates" description="Rates come from the active pricing rule for each service." />
        <CardBody className="p-0">
          <ul className="divide-y divide-ink-50">
            {services.map((service) => (
              <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-ink-900">{service.name}</p>
                  <p className="text-xs text-ink-400">{service.category.name}</p>
                </div>
                <p className="text-sm text-ink-600">
                  {service.pricingRules[0]
                    ? `${service.pricingRules[0].currency} ${(
                        service.pricingRules[0].baseRatePerWordMinor / 100
                      ).toFixed(2)} per word`
                    : "Quoted manually"}
                </p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Recent audit log" />
        <CardBody className="p-0">
          <ul className="divide-y divide-ink-50">
            {audits.map((entry) => (
              <li key={entry.id} className="px-5 py-3 text-sm">
                <span className="font-medium text-ink-900">{entry.action}</span>{" "}
                <span className="text-ink-500">
                  {entry.resourceType} · {entry.actor?.name ?? "System"}
                </span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
