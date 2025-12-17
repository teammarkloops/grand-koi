"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Trash2, Plus, UploadCloud, CheckCircle2, Loader2, Save, XCircle, Eraser
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createProduct } from "@/lib/server-actions";
import { toast } from "sonner";
import {
  MAIN_CATEGORIES,
  SUB_CATEGORIES,
  SEX_OPTIONS,
  BREEDER_OPTIONS,
  type MainCategory,
} from "@/lib/config";

// --- Types ---
export type UploadStatus = "idle" | "pending" | "success" | "error";

export interface ProductRow {
  id: string; // Internal ID for React keys
  title: string;
  description: string;
  price: string;
  mainCategory: MainCategory | "";
  subCategory: string;
  breeder: string;
  sex: string;
  age: string;
  sizeCm: string;
  sizeIn: string;
  imageFile: File | null; // Not persisted in localStorage
  status: UploadStatus;
  errorMessage?: string;
}

const STORAGE_KEY = "bulk-product-drafts";

export function BulkEditor() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Ref for auto-save debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize & Load from LocalStorage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Hydrate rows. Note: imageFile cannot be restored from JSON.
        const hydrated = parsed.map((p: any) => ({
          ...p,
          imageFile: null, // Reset images
          status: p.status === "pending" ? "idle" : p.status, // Reset stuck pending states
        }));
        
        if (hydrated.length > 0) {
          setRows(hydrated);
        } else {
          setRows([createEmptyRow()]);
        }
      } catch (e) {
        setRows([createEmptyRow()]);
      }
    } else {
      setRows([createEmptyRow()]);
    }
  }, []);

  // 2. Auto-Save Logic (Debounced)
  useEffect(() => {
    if (!isClient) return;
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      // If we have rows, save them. If rows is empty, we still save (as empty array)
      const dataToSave = rows.map(({ imageFile, ...rest }) => rest);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    }, 1000); // Save 1 second after last change

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [rows, isClient]);

  // --- Helper Functions ---

  function createEmptyRow(): ProductRow {
    return {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      price: "",
      mainCategory: "",
      subCategory: "",
      breeder: "",
      sex: "",
      age: "",
      sizeCm: "",
      sizeIn: "",
      imageFile: null,
      status: "idle",
    };
  }

  const addRow = () => {
    if (rows.length >= 50) {
      toast.error("Limit Reached", { description: "Max 50 products at a time." });
      return;
    }
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };
  
  const clearCompleted = () => {
    setRows((prev) => prev.filter((r) => r.status !== "success"));
  };

  const updateRow = (id: string, field: keyof ProductRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        
        // Logic for resetting subcat if main cat changes
        if (field === "mainCategory") {
           return { ...row, [field]: value, subCategory: "" };
        }
        return { ...row, [field]: value };
      })
    );
  };

  // --- Bulk Upload Logic ---
  
  const handleBulkUpload = async () => {
    const pendingRows = rows.filter(r => r.status === "idle" || r.status === "error");
    if (pendingRows.length === 0) {
      toast.info("Nothing to upload", { description: "Add rows or check status." });
      return;
    }

    setIsUploading(true);
    
    // Batch size of 3 prevents browser freeze and rate limits
    const BATCH_SIZE = 3;
    
    // Helper to process a single row
    const processRow = async (row: ProductRow) => {
      // 1. Update status to pending
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: "pending", errorMessage: undefined } : r));

      const formData = new FormData();
      formData.append("title", row.title);
      formData.append("descriptionHtml", row.description);
      formData.append("price", row.price);
      formData.append("mainCategory", row.mainCategory);
      formData.append("subCategory", row.subCategory);
      formData.append("breeder", row.breeder);
      formData.append("sex", row.sex);
      formData.append("size", row.sizeCm);
      formData.append("size_in", row.sizeIn);
      formData.append("age", row.age);
      if (row.imageFile) formData.append("imageFile", row.imageFile);

      const result = await createProduct(formData);

      setRows(prev => prev.map(r => {
        if (r.id !== row.id) return r;
        return {
          ...r,
          status: result.success ? "success" : "error",
          errorMessage: result.error
        };
      }));
      
      return result.success;
    };

    // Queue processor
    const queue = [...pendingRows];
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      await Promise.all(batch.map(row => processRow(row)));
    }

    setIsUploading(false);
    
    // Check final state
    // We need to check the *current* state of rows, but state updates are async.
    // However, in this function scope, we know we finished. 
    // We will check localStorage logic in the next render cycle via useEffect, 
    // OR we can explicitly check here if we want to clear immediately.
    
    // Let's do a quick check on the updated rows logic:
    // Since we can't access the *updated* state immediately here due to closures,
    // we will trigger a check via a timeout or rely on the user to see the green success.
    
    toast.success("Batch Processing Complete");
  };
  
  // Effect: Check if all products are successful to clear storage
  useEffect(() => {
    if (rows.length > 0 && rows.every(r => r.status === "success")) {
        // All rows are green. Clear storage so user starts fresh next reload.
        localStorage.removeItem(STORAGE_KEY);
        toast.success("All products uploaded successfully!", {
             description: "Draft storage has been cleared for a fresh start."
        });
    }
  }, [rows]);

  // --- Render ---

  if (!isClient) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  const successCount = rows.filter(r => r.status === "success").length;
  const errorCount = rows.filter(r => r.status === "error").length;
  const progress = (successCount / rows.length) * 100;

  return (
    <div className="space-y-4 font-sans">
      {/* Header Actions */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-card p-4 rounded-xl border shadow-sm sticky top-4 z-30">
        <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Bulk Product Creator
                <Badge variant="secondary" className="text-xs font-normal">
                    {rows.length} Items
                </Badge>
            </h2>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1 text-green-600 font-medium">
                    <CheckCircle2 className="h-4 w-4" /> {successCount} Done
                </span>
                {errorCount > 0 && (
                    <span className="flex items-center gap-1 text-destructive font-medium">
                        <XCircle className="h-4 w-4" /> {errorCount} Errors
                    </span>
                )}
                {rows.some(r => r.imageFile === null && r.title !== "") && (
                     <span className="hidden sm:inline-block text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        ⚠ Images reset on refresh
                    </span>
                )}
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
             <Button variant="ghost" size="sm" onClick={clearCompleted} disabled={isUploading || successCount === 0} className="text-muted-foreground hover:text-foreground">
                <Eraser className="mr-2 h-4 w-4" /> Clear Completed
            </Button>
            <Button variant="outline" onClick={addRow} disabled={isUploading}>
                <Plus className="mr-2 h-4 w-4" /> Add Row
            </Button>
            <Button onClick={handleBulkUpload} disabled={isUploading || rows.length === 0} className="min-w-[140px]">
                {isUploading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {Math.round(progress)}%</>
                ) : (
                    <><UploadCloud className="mr-2 h-4 w-4" /> Upload Pending</>
                )}
            </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
          <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
              />
          </div>
      )}

      {/* Data Table */}
      <div className="border rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
        <div className="overflow-x-auto">
            <Table className="min-w-[2000px] border-separate border-spacing-0">
            <TableHeader className="bg-muted/40 sticky top-0 z-20 shadow-sm backdrop-blur-sm">
                <TableRow>
                <TableHead className="w-[50px] text-center font-bold">#</TableHead>
                <TableHead className="w-[180px] min-w-[180px] font-bold">Title</TableHead>
                <TableHead className="w-[250px] min-w-[250px] font-bold">Description</TableHead>
                <TableHead className="w-[120px] min-w-[120px] font-bold">Price</TableHead>
                <TableHead className="w-[160px] min-w-[160px] font-bold">Main Category</TableHead>
                <TableHead className="w-[160px] min-w-[160px] font-bold">Sub Category</TableHead>
                <TableHead className="w-[140px] min-w-[140px] font-bold">Breeder</TableHead>
                <TableHead className="w-[120px] min-w-[120px] font-bold">Sex</TableHead>
                <TableHead className="w-[80px] min-w-[80px] font-bold">Age (yr)</TableHead>
                <TableHead className="w-[100px] min-w-[100px] font-bold">Size (cm)</TableHead>
                <TableHead className="w-[100px] min-w-[100px] font-bold">Size (in)</TableHead>
                <TableHead className="w-[200px] min-w-[200px] font-bold">Image</TableHead>
                <TableHead className="w-[100px] text-center font-bold">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.map((row, index) => (
                <TableRow key={row.id} className={`group hover:bg-muted/30 transition-colors ${row.status === "success" ? "bg-green-50/60 hover:bg-green-100/60" : ""}`}>
                    <TableCell className="text-center font-medium text-muted-foreground border-r bg-muted/5">{index + 1}</TableCell>
                    
                    {/* Title */}
                    <TableCell>
                        <Input 
                            value={row.title} 
                            onChange={(e) => updateRow(row.id, "title", e.target.value)}
                            placeholder="Product Title"
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                        />
                    </TableCell>

                    {/* Description */}
                    <TableCell>
                        <Textarea 
                            value={row.description}
                            onChange={(e) => updateRow(row.id, "description", e.target.value)}
                            placeholder="Details..."
                            rows={1}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="min-h-[36px] py-2 resize-none border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all focus:min-h-[80px] absolute top-2 w-[90%] z-10 focus:z-50 focus:shadow-md"
                        />
                        {/* Placeholder div to keep cell height consistent */}
                        <div className="h-9"></div> 
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                        <Input 
                            type="number" 
                            step="0.01"
                            value={row.price} 
                            onChange={(e) => updateRow(row.id, "price", e.target.value)}
                            placeholder="0.00"
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                        />
                    </TableCell>

                    {/* Main Category */}
                    <TableCell>
                        <NativeSelect
                            value={row.mainCategory}
                            onChange={(e) => updateRow(row.id, "mainCategory", e.target.value)}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 w-full border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                        >
                        <NativeSelectOption value="" disabled>Select...</NativeSelectOption>
                        {MAIN_CATEGORIES.map(c => <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>)}
                        </NativeSelect>
                    </TableCell>

                    {/* Sub Category */}
                    <TableCell>
                        <NativeSelect
                            value={row.subCategory}
                            onChange={(e) => updateRow(row.id, "subCategory", e.target.value)}
                            disabled={!row.mainCategory || row.status === "success" || row.status === "pending"}
                            className="h-9 w-full border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                        >
                        <NativeSelectOption value="" disabled>Select...</NativeSelectOption>
                        {row.mainCategory && SUB_CATEGORIES[row.mainCategory]?.map(c => (
                            <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                        ))}
                        </NativeSelect>
                    </TableCell>

                    {/* Breeder */}
                    <TableCell>
                        <NativeSelect
                            value={row.breeder}
                            onChange={(e) => updateRow(row.id, "breeder", e.target.value)}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 w-full border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                        >
                         <NativeSelectOption value="" disabled>Select...</NativeSelectOption>
                         {BREEDER_OPTIONS.map(c => <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>)}
                        </NativeSelect>
                    </TableCell>

                    {/* Sex */}
                    <TableCell>
                        <NativeSelect
                            value={row.sex}
                            onChange={(e) => updateRow(row.id, "sex", e.target.value)}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 w-full border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                        >
                         <NativeSelectOption value="" disabled>Select...</NativeSelectOption>
                         {SEX_OPTIONS.map(c => <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>)}
                        </NativeSelect>
                    </TableCell>

                    {/* Age */}
                    <TableCell>
                        <Input 
                            type="number" 
                            value={row.age} 
                            onChange={(e) => updateRow(row.id, "age", e.target.value)}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                            placeholder="Years"
                        />
                    </TableCell>

                    {/* Size CM */}
                    <TableCell>
                        <Input 
                            type="number"
                            step="0.01"
                            value={row.sizeCm} 
                            onChange={(e) => updateRow(row.id, "sizeCm", e.target.value)}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                            placeholder="cm"
                        />
                    </TableCell>

                    {/* Size IN */}
                    <TableCell>
                        <Input 
                            type="number"
                            step="0.01"
                            value={row.sizeIn} 
                            onChange={(e) => updateRow(row.id, "sizeIn", e.target.value)}
                            disabled={row.status === "success" || row.status === "pending"}
                            className="h-9 border-transparent bg-transparent hover:bg-background hover:border-input focus:bg-background focus:border-ring transition-all"
                            placeholder="in"
                        />
                    </TableCell>

                    {/* Image File */}
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    updateRow(row.id, "imageFile", file);
                                }}
                                disabled={row.status === "success" || row.status === "pending"}
                                className="h-9 text-xs file:text-xs file:py-1 cursor-pointer border-transparent bg-transparent hover:bg-background hover:border-input"
                            />
                            {row.imageFile && <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 animate-in zoom-in" />}
                        </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="text-center">
                        {row.status === "idle" && <Badge variant="outline" className="text-muted-foreground font-normal">Draft</Badge>}
                        {row.status === "pending" && <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50"><Loader2 className="h-3 w-3 animate-spin mr-1"/>Wait</Badge>}
                        {row.status === "success" && <Badge variant="default" className="bg-green-600 hover:bg-green-600">Done</Badge>}
                        {row.status === "error" && (
                            <div className="group relative flex justify-center cursor-help">
                                <Badge variant="destructive">Error</Badge>
                                <div className="absolute right-full mr-2 top-0 hidden w-64 bg-destructive text-destructive-foreground text-xs rounded p-2 shadow-lg group-hover:block z-50">
                                    <p className="font-semibold mb-1">Upload Failed:</p>
                                    {row.errorMessage}
                                </div>
                            </div>
                        )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeRow(row.id)}
                            disabled={row.status === "pending"}
                            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                </TableRow>
                ))}
            </TableBody>
            </Table>
        </div>
      </div>
      
      {/* Footer Instructions */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 pl-4 border rounded-lg bg-muted/20">
         <Save className="h-4 w-4 text-blue-500" />
         <span>Progress saves automatically. Local storage clears only when all products upload successfully.</span>
      </div>
    </div>
  );
}