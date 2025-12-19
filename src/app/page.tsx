import { BulkEditor } from "@/components/bulk-editor";

export default function BulkCreatePage() {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Bulk Product Creator</h1>
            <p className="text-muted-foreground">
              Add multiple products efficiently. Rows with errors can be retried individually.
            </p>
          </div>
        </div>
        
        <BulkEditor />
      </div>
    </div>
  );
}