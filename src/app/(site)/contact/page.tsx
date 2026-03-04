"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const submit = api.contact.submit.useMutation({
    onSuccess: () => setSubmitted(true),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit.mutate(form);
  };

  return (
    <>
      <section className="bg-secondary/50 px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="font-serif text-5xl font-bold text-foreground">Contact Us</h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
            Whether you're interested in partnering, donating, volunteering as a trainer, or seeking employment — we'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl">
          {submitted ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-12 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" />
              <h2 className="font-serif text-2xl font-bold text-foreground">Message Received</h2>
              <p className="mt-3 text-muted-foreground">
                Thank you for reaching out! We'll get back to you as soon as we can.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => {
                  setSubmitted(false);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="What's this about?"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                <Textarea
                  id="message"
                  required
                  rows={6}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Tell us how we can help or how you'd like to get involved…"
                  className="resize-none"
                />
              </div>

              {submit.error && (
                <p className="text-sm text-destructive">{submit.error.message}</p>
              )}

              <Button type="submit" disabled={submit.isPending} className="w-full rounded-full">
                {submit.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  "Send Message"
                )}
              </Button>
            </form>
          )}

          <div className="mt-12 border-t pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              You can also reach us at{" "}
              <a href="mailto:trellis.wd@gmail.com" className="text-primary hover:underline">
                trellis.wd@gmail.com
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
