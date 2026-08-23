"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { Alert, Card, CardBody, Field, Input, Select, Textarea } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/cn";

export type WizardService = {
  id: string;
  name: string;
  slug: string;
  category: string;
  hasPricing: boolean;
};

type Estimate = {
  currency: string;
  lines: { description: string; totalMinor: number }[];
  subtotalMinor: number;
  taxMinor: number;
  taxLabel: string;
  totalMinor: number;
};

const steps = ["Service", "Document", "Files", "Contact"] as const;

const complexities = [
  { value: "STANDARD", label: "Standard — general subject matter" },
  { value: "TECHNICAL", label: "Technical — specialist vocabulary" },
  { value: "SPECIALIST", label: "Specialist — highly technical or regulated" },
];

const citationStyles = ["Not applicable", "APA", "Harvard", "MLA", "Chicago", "Vancouver", "OSCOLA"];

function defaultDeadline() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function QuoteWizard({
  services,
  defaults,
  signedIn,
}: {
  services: WizardService[];
  defaults: { contactName: string; contactEmail: string };
  signedIn: boolean;
}) {
  const params = useSearchParams();
  const preselected = services.find((service) => service.slug === params.get("service"));

  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState(preselected?.id ?? "");
  const [serviceOther, setServiceOther] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [wordCount, setWordCount] = useState(3000);
  const [complexity, setComplexity] = useState("STANDARD");
  const [deadline, setDeadline] = useState(defaultDeadline());
  const [citationStyle, setCitationStyle] = useState("Not applicable");
  const [industry, setIndustry] = useState("");
  const [needsFormatting, setNeedsFormatting] = useState(false);
  const [needsResearch, setNeedsResearch] = useState(false);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [confidentiality, setConfidentiality] = useState("");

  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);

  const selected = useMemo(
    () => services.find((service) => service.id === serviceId),
    [services, serviceId],
  );

  const refreshEstimate = useCallback(async () => {
    if (!serviceId || !wordCount || !deadline) return;
    setEstimateError(null);
    const response = await fetch("/api/pricing/estimate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceId,
        wordCount,
        complexity,
        deadline: new Date(`${deadline}T17:00:00`).toISOString(),
        fileCount: Math.max(1, files.length),
        needsFormatting,
        needsResearch,
      }),
    });
    if (!response.ok) {
      setEstimate(null);
      setEstimateError("An estimate is not available for this service — we will quote manually.");
      return;
    }
    const body = await response.json();
    setEstimate(body.estimate);
  }, [serviceId, wordCount, complexity, deadline, files.length, needsFormatting, needsResearch]);

  useEffect(() => {
    if (step >= 1) void refreshEstimate();
  }, [step, refreshEstimate]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    form.set("serviceId", serviceId);
    form.set("serviceOther", serviceOther);
    form.set("documentType", documentType);
    form.set("wordCount", String(wordCount));
    form.set("complexity", complexity);
    form.set("deadline", new Date(`${deadline}T17:00:00`).toISOString());
    form.set("citationStyle", citationStyle);
    form.set("industry", industry);
    form.set("confidentiality", confidentiality);
    form.set("needsFormatting", String(needsFormatting));
    form.set("needsResearch", String(needsResearch));
    form.set("description", description);
    for (const file of files) form.append("files", file);

    const response = await fetch("/api/quote-requests", { method: "POST", body: form });
    setSubmitting(false);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setError(body.error ?? "We could not submit your request.");
      return;
    }
    const body = await response.json();
    setReference(body.reference);
  }

  if (reference) {
    return (
      <Card>
        <CardBody className="p-8 text-center">
          <h2 className="text-2xl">Request received</h2>
          <p className="mt-3 text-ink-600">
            Your reference is <span className="font-semibold text-ink-900">{reference}</span>. Our
            team is reviewing the brief and will send a written quotation.
          </p>
          {estimate ? (
            <p className="mt-4 text-sm text-ink-500">
              Indicative estimate: {formatMoney(estimate.totalMinor, estimate.currency)}. The
              quotation you receive is the binding price.
            </p>
          ) : null}
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href={signedIn ? "/dashboard" : "/register"}
              className="text-sm font-medium text-accent-700 hover:text-accent-800"
            >
              {signedIn ? "Go to your dashboard" : "Create an account to track this request"}
            </Link>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <form onSubmit={submit}>
      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Progress">
        {steps.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                index === step
                  ? "bg-ink-900 text-white"
                  : index < step
                    ? "bg-accent-50 text-accent-700"
                    : "bg-ink-100 text-ink-500",
              )}
              aria-current={index === step ? "step" : undefined}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <Card>
        <CardBody className="space-y-5 p-6">
          {error ? <Alert tone="danger">{error}</Alert> : null}

          {step === 0 ? (
            <>
              <Field label="Which service do you need?" required>
                <Select
                  value={serviceId}
                  onChange={(event) => setServiceId(event.target.value)}
                  required={!serviceOther}
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.category} — {service.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Not listed?"
                hint="Describe what you need and we will match it to a service."
              >
                <Input
                  value={serviceOther}
                  onChange={(event) => setServiceOther(event.target.value)}
                  placeholder="e.g. Board paper review"
                />
              </Field>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Document type" hint="Thesis, proposal, report, manual…">
                  <Input
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                  />
                </Field>
                <Field label="Approximate word count" required>
                  <Input
                    type="number"
                    min={1}
                    required
                    value={wordCount}
                    onChange={(event) => setWordCount(Number(event.target.value))}
                  />
                </Field>
              </div>
              <Field label="Subject complexity" required>
                <Select value={complexity} onChange={(event) => setComplexity(event.target.value)}>
                  {complexities.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Deadline" required>
                  <Input
                    type="date"
                    required
                    value={deadline}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setDeadline(event.target.value)}
                  />
                </Field>
                <Field label="Citation style">
                  <Select
                    value={citationStyle}
                    onChange={(event) => setCitationStyle(event.target.value)}
                  >
                    {citationStyles.map((style) => (
                      <option key={style}>{style}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Industry or field" hint="Optional">
                <Input value={industry} onChange={(event) => setIndustry(event.target.value)} />
              </Field>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={needsFormatting}
                    onChange={(event) => setNeedsFormatting(event.target.checked)}
                  />
                  Formatting to a template
                </label>
                <label className="flex items-center gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={needsResearch}
                    onChange={(event) => setNeedsResearch(event.target.checked)}
                  />
                  Additional research required
                </label>
              </div>
              <Field label="What do you need done?" required>
                <Textarea
                  required
                  minLength={10}
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the document, the audience and anything we must follow."
                />
              </Field>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Field
                label="Upload your documents"
                hint="PDF, Word, Excel, PowerPoint, text or images. Files are stored privately."
              >
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-ink-300 px-6 py-10 text-center hover:border-accent-400">
                  <UploadCloud className="text-ink-400" aria-hidden />
                  <span className="text-sm text-ink-600">Choose files</span>
                  <input
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={(event) =>
                      setFiles((current) => [...current, ...Array.from(event.target.files ?? [])])
                    }
                  />
                </label>
              </Field>

              {files.length ? (
                <ul className="space-y-2">
                  {files.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-md border border-ink-100 px-3 py-2 text-sm"
                    >
                      <span className="truncate text-ink-700">{file.name}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${file.name}`}
                        className="text-ink-400 hover:text-red-600"
                        onClick={() =>
                          setFiles((current) => current.filter((_, i) => i !== index))
                        }
                      >
                        <X size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <Field label="Confidentiality requirements" hint="Optional — e.g. NDA required">
                <Input
                  value={confidentiality}
                  onChange={(event) => setConfidentiality(event.target.value)}
                />
              </Field>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required>
                  <Input name="contactName" required defaultValue={defaults.contactName} />
                </Field>
                <Field label="Email address" required>
                  <Input
                    name="contactEmail"
                    type="email"
                    required
                    defaultValue={defaults.contactEmail}
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone" hint="Optional">
                  <Input name="contactPhone" />
                </Field>
                <Field label="Organisation" hint="Optional">
                  <Input name="organizationName" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Country">
                  <Input name="country" defaultValue="Uganda" />
                </Field>
                <Field label="Preferred contact method">
                  <Select name="preferredContact" defaultValue="EMAIL">
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="WHATSAPP">WhatsApp</option>
                  </Select>
                </Field>
              </div>
            </>
          ) : null}

          {step >= 1 ? (
            <div className="rounded-lg border border-ink-100 bg-ink-50 p-4">
              <p className="text-sm font-medium text-ink-900">Indicative estimate</p>
              {estimate ? (
                <>
                  <dl className="mt-3 space-y-1 text-sm text-ink-600">
                    {estimate.lines.map((line) => (
                      <div key={line.description} className="flex justify-between gap-4">
                        <dt>{line.description}</dt>
                        <dd>{formatMoney(line.totalMinor, estimate.currency)}</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4">
                      <dt>{estimate.taxLabel}</dt>
                      <dd>{formatMoney(estimate.taxMinor, estimate.currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-ink-200 pt-2 font-semibold text-ink-900">
                      <dt>Estimated total</dt>
                      <dd>{formatMoney(estimate.totalMinor, estimate.currency)}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-ink-500">
                    This is an estimate, not a quotation. Our team confirms the final price after
                    reviewing your files.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-ink-600">
                  {estimateError ?? "Complete the document details to see an estimate."}
                </p>
              )}
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0}
            >
              Back
            </Button>
            {step < steps.length - 1 ? (
              <Button
                type="button"
                onClick={() => setStep((value) => value + 1)}
                disabled={step === 0 && !serviceId && !serviceOther}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
            )}
          </div>
          {selected && !selected.hasPricing ? (
            <p className="text-xs text-ink-500">
              {selected.name} is quoted manually — you will receive a written quotation instead of
              an instant estimate.
            </p>
          ) : null}
        </CardBody>
      </Card>
    </form>
  );
}
