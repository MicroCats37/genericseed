"use client";

import React, { useState, useRef } from "react";
import { GenericModal, GenericModalRef } from "@/components/genericModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * 🛠️ Stress Test Component for Modular Modals
 */

export default function ModalExamplesPage() {
  const [isControlledOpen, setIsControlledOpen] = useState(false);
  const modalRef = useRef<GenericModalRef>(null);

  return (
    <div className="container mx-auto p-12 space-y-8 min-h-screen bg-slate-50">
      <div className="space-y-2 border-b pb-4">
        <h1 className="text-4xl font-extrabold tracking-tight">GenericModal: Compound API (React 19)</h1>
        <p className="text-muted-foreground">Demonstrating flexible, modular, and extensible architecture.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* --- 1. UNCONTROLLED LEGO --- */}
        <section className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">1. Uncontrolled Composition</h2>
          <p className="text-sm text-muted-foreground">Self-managed state with 'Trigger' and 'CloseX' compounds.</p>

          <GenericModal>
            <GenericModal.Trigger asChild>
              <Button variant="outline" className="w-full">Open Simple Lego</Button>
            </GenericModal.Trigger>

            <GenericModal.Content>
              <GenericModal.Header
                title="Configuration"
                description="Lego Header handles title/desc automatically."
              >
                <GenericModal.CloseX />
              </GenericModal.Header>
              <GenericModal.Body>
                <div className="py-4 space-y-4 border rounded-sm p-4 bg-slate-50 italic">
                  I am a child inside GenericModal.Body
                </div>
              </GenericModal.Body>
              <GenericModal.Footer>
                <GenericModal.Close asChild>
                  <Button variant="ghost">Cancel</Button>
                </GenericModal.Close>
                <Button>Save Changes</Button>
              </GenericModal.Footer>
            </GenericModal.Content>
          </GenericModal>
        </section>

        {/* --- 2. CONTROLLED MODE --- */}
        <section className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">2. Controlled Mode</h2>
          <p className="text-sm text-muted-foreground">Using external [open, onOpenChange] state.</p>

          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsControlledOpen(true)}
          >
            Open Manually
          </Button>

          <GenericModal open={isControlledOpen} onOpenChange={setIsControlledOpen}>
            <GenericModal.Content className="md:min-w-[400px]">
              <GenericModal.Header title="Externally Controlled">
                <GenericModal.CloseX />
              </GenericModal.Header>
              <GenericModal.Body>
                <p>Status: {isControlledOpen ? "Visible" : "Hidden"}</p>
              </GenericModal.Body>
              <GenericModal.Footer>
                <Button variant="outline" onClick={() => setIsControlledOpen(false)}>Close Externally</Button>
                <GenericModal.Close asChild>
                  <Button>Auto Close Atom</Button>
                </GenericModal.Close>
              </GenericModal.Footer>
            </GenericModal.Content>
          </GenericModal>
        </section>

        {/* --- 3. REACT 19 REF (IMPERATIVE) --- */}
        <section className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">3. React 19 Ref (No forwardRef)</h2>
          <p className="text-sm text-muted-foreground">Executing ref.current.open() directly from standard props.</p>

          <Button variant="secondary" className="w-full" onClick={() => modalRef.current?.open()}>
            Trigger via Ref
          </Button>

          <GenericModal ref={modalRef}>
            <GenericModal.Content>
              <GenericModal.Header title="Imperative Control">
                 <GenericModal.CloseX />
              </GenericModal.Header>
              <GenericModal.Body>
                <p>This modal was opened using a Native Ref prop in React 19.</p>
              </GenericModal.Body>
              <GenericModal.Footer>
                <Button variant="destructive" onClick={() => modalRef.current?.close()}>Force Close via Ref</Button>
              </GenericModal.Footer>
            </GenericModal.Content>
          </GenericModal>
        </section>

        {/* --- 4. ADVANCED: STICKY FOOTER & SCROLL --- */}
        <section className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">4. Stress Test: Long Content</h2>
          <p className="text-sm text-muted-foreground">Sticky Header/Footer + Flexible width + Internal Scroll.</p>

          <GenericModal preventClose>
            <GenericModal.Trigger asChild>
              <Button variant="default" className="w-full">Open Heavy Scrollable Modal</Button>
            </GenericModal.Trigger>

            <GenericModal.Content className="sm:max-w-xl">
              <GenericModal.Header
                title="Enterprise Form"
                description="Try scrolling the content. The Footer stays static (Sticky)."
                className="bg-slate-50 border-b"
              />
              <GenericModal.Body>
                <div className="space-y-6 py-4">
                  {Array.from({ length: 15 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Label>Field Number {i + 1}</Label>
                      <Input placeholder={`Enter data for ${i + 1}...`} />
                    </div>
                  ))}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    ⚠️ Warning: preventClose={"true"} is active. You must use the footer to close.
                  </div>
                </div>
              </GenericModal.Body>
              <GenericModal.Footer className="bg-slate-50 border-t shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
                <GenericModal.Close asChild>
                  <Button variant="outline">Cancel & Discard</Button>
                </GenericModal.Close>
                <Button className="bg-green-600 hover:bg-green-700">Save Massive Record</Button>
              </GenericModal.Footer>
            </GenericModal.Content>
          </GenericModal>
        </section>

        {/* --- 5. SIZE TESTS --- */}
        <section className="p-6 bg-white rounded-xl border shadow-sm space-y-4">
          <h2 className="text-xl font-semibold">5. Precision Sizing (Hug vs Fixed)</h2>
          <p className="text-sm text-muted-foreground">Demo of 'w-fit' (auto) vs custom classes (max-w, min-w).</p>

          <div className="flex flex-col gap-2">
            {/* Auto Width (Hug content) */}
            <GenericModal>
              <GenericModal.Trigger asChild>
                <Button variant="ghost" className="w-full">Size: Auto (Hug Content)</Button>
              </GenericModal.Trigger>
              <GenericModal.Content>
                <GenericModal.CloseX />
                <GenericModal.Body>
                  <div className="p-10 border-2 border-dashed rounded bg-slate-50 text-center">
                    I am tiny content. <br /> The modal hugs me.
                  </div>
                </GenericModal.Body>
                <GenericModal.Footer>
                  <GenericModal.Close asChild><Button>Ok</Button></GenericModal.Close>
                </GenericModal.Footer>
              </GenericModal.Content>
            </GenericModal>

            {/* Custom Large Width */}
            <GenericModal>
              <GenericModal.Trigger asChild>
                <Button variant="ghost" className="w-full">Size: Custom (min-w-3xl)</Button>
              </GenericModal.Trigger>
              <GenericModal.Content className="sm:min-w-[800px]">
                <GenericModal.Header title="Wide Content Display" description="Overriding 'fit-content' with a hard min-width.">
                  <GenericModal.CloseX />
                </GenericModal.Header>
                <GenericModal.Body className="bg-slate-50 border h-40 flex items-center justify-center">
                  This modal is explicitly wider even with little content.
                </GenericModal.Body>
                <GenericModal.Footer>
                  <GenericModal.Close asChild><Button>Close</Button></GenericModal.Close>
                </GenericModal.Footer>
              </GenericModal.Content>
            </GenericModal>

            {/* Full Screen */}
            <GenericModal>
              <GenericModal.Trigger asChild>
                <Button variant="ghost" className="w-full">Size: Full Screen Mobile/Desktop</Button>
              </GenericModal.Trigger>
              <GenericModal.Content className="w-[100vw] h-[100vh] max-h-screen max-w-full rounded-none">
                <GenericModal.Header title="Full Screen View">
                  <GenericModal.CloseX />
                </GenericModal.Header>
                <GenericModal.Body className="bg-slate-100 flex items-center justify-center text-3xl font-bold">
                  100% UTILIZED SPACE
                </GenericModal.Body>
                <GenericModal.Footer>
                  <GenericModal.Close asChild><Button size="lg">Exit Full Screen</Button></GenericModal.Close>
                </GenericModal.Footer>
              </GenericModal.Content>
            </GenericModal>
          </div>
        </section>

      </div>
    </div>
  );
}
