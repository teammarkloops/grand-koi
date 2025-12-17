"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Trash2, Plus, UploadCloud, CheckCircle2, Loader2, Save, XCircle, Eraser, Image as ImageIcon, AlertCircle, Sparkles, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { createProduct } from "@/lib/server-actions";
import { toast } from "sonner";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
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
  id: string; 
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
  imageFile: File | null;
  status: UploadStatus;
  errorMessage?: string;
}

const STORAGE_KEY = "bulk-product-drafts";

export function BulkEditor() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Test Modal State
  const [showTestModal, setShowTestModal] = useState(false);
  const [testCount, setTestCount] = useState(10);
  const [testImage, setTestImage] = useState<File | null>(null);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initialize
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const hydrated = parsed.map((p: any) => ({
          ...p,
          imageFile: null,
          status: p.status === "pending" ? "idle" : p.status, // Reset stuck pending
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

  // 2. Auto-Save (Debounced for Text Input)
  useEffect(() => {
    if (!isClient) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveToLocalStorage(rows);
    }, 1000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [rows, isClient]);

  // --- Helper Functions ---

  // Centralized save function to ensure consistency
  const saveToLocalStorage = (currentRows: ProductRow[]) => {
    const dataToSave = currentRows.map(({ imageFile, ...rest }) => rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  };

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

  // --- ACTIONS ---

  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete ALL rows? This cannot be undone.")) {
      const newRows = [createEmptyRow()];
      setRows(newRows);
      saveToLocalStorage(newRows); // Instant save
      toast.success("All rows cleared");
    }
  };

  const generateTestProducts = () => {
    if (testCount < 1 || testCount > 50) {
        toast.error("Please enter a number between 1 and 50.");
        return;
    }
    
    if (rows.length + testCount > 60) {
       toast.warning("You are creating a very large batch. Uploading might take time.");
    }

    const isFirstRowEmpty = rows.length === 1 && !rows[0].title && !rows[0].price;
    const startCount = isFirstRowEmpty ? 0 : rows.length;
    
    const newRows: ProductRow[] = Array.from({ length: testCount }).map((_, i) => {
      const mainCat = MAIN_CATEGORIES[Math.floor(Math.random() * MAIN_CATEGORIES.length)];
      const subCats = SUB_CATEGORIES[mainCat];
      const subCat = subCats[Math.floor(Math.random() * subCats.length)];
      const breeder = BREEDER_OPTIONS[Math.floor(Math.random() * BREEDER_OPTIONS.length)];
      const sex = SEX_OPTIONS[Math.floor(Math.random() * SEX_OPTIONS.length)];
      const price = Math.floor(Math.random() * (50000 - 5000) + 5000).toString();
      const age = Math.floor(Math.random() * 5 + 1).toString();
      const sizeCm = Math.floor(Math.random() * 80 + 20).toString();
      
      return {
        id: crypto.randomUUID(),
        title: `Test Product ${startCount + i + 1}`,
        description: `Generated: ${breeder} ${subCat} (${sex})`,
        price: price,
        mainCategory: mainCat,
        subCategory: subCat,
        breeder: breeder,
        sex: sex,
        age: age,
        sizeCm: sizeCm,
        sizeIn: (parseFloat(sizeCm) / 2.54).toFixed(1),
        imageFile: testImage,
        status: "idle",
      };
    });

    let updatedRows: ProductRow[];
    
    if (isFirstRowEmpty) {
        updatedRows = newRows;
    } else {
        updatedRows = [...rows, ...newRows];
    }

    setRows(updatedRows);
    saveToLocalStorage(updatedRows); // Instant save so refresh keeps them
    setShowTestModal(false);
    setTestImage(null);
    toast.success(`Added ${testCount} Test Products`);
  };

  const addRow = () => {
    if (rows.length >= 50) {
      toast.error("Limit Reached", { description: "Max 50 products at a time." });
      return;
    }
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => {
        const next = prev.filter((r) => r.id !== id);
        // Ensure at least one empty row remains if all deleted
        if (next.length === 0) {
            const empty = [createEmptyRow()];
            saveToLocalStorage(empty);
            return empty;
        }
        return next;
    });
  };
  
  const clearCompleted = () => {
    setRows((prev) => {
        const next = prev.filter((r) => r.status !== "success");
        if (next.length === 0) {
            const empty = [createEmptyRow()];
            saveToLocalStorage(empty);
            return empty;
        }
        saveToLocalStorage(next);
        return next;
    });
  };

  const updateRow = (id: string, field: keyof ProductRow, value: any) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        if (field === "mainCategory") {
           return { ...row, [field]: value, subCategory: "" };
        }
        return { ...row, [field]: value };
      })
    );
  };

  // --- UPLOAD LOGIC ---
  const handleBulkUpload = async () => {
    const pendingRows = rows.filter(r => r.status === "idle" || r.status === "error");
    if (pendingRows.length === 0) {
      toast.info("Nothing to upload", { description: "Add rows or check status." });
      return;
    }

    setIsUploading(true);
    const BATCH_SIZE = 5;
    
    // Helper to process a single row and IMMEDIATELY update storage
    const processRow = async (row: ProductRow) => {
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

      setRows(prev => {
        const nextRows = prev.map(r => {
            if (r.id !== row.id) return r;
            return {
                ...r,
                status: result.success ? "success" : "error",
                errorMessage: result.error
            } as ProductRow;
        });
        
        // Force save to storage immediately. 
        // We use nextRows to get the exact state we just calculated.
        saveToLocalStorage(nextRows);
        
        return nextRows;
      });
      
      return result.success;
    };

    const queue = [...pendingRows];
    while (queue.length > 0) {
      const batch = queue.splice(0, BATCH_SIZE);
      await Promise.all(batch.map(row => processRow(row)));
    }

    setIsUploading(false);
    toast.success("Batch Processing Complete");
  };
  
  // Cleanup effect: If everything is green, clear storage
  useEffect(() => {
    const isNotEmpty = rows.length > 0 && (rows[0].title !== "" || rows.length > 1);
    if (isNotEmpty && rows.every(r => r.status === "success")) {
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
    <div className="space-y-6 font-sans pb-20 relative">
      
      {/* --- Sticky Header with Dialog --- */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between bg-background/80 backdrop-blur-md p-4 rounded-xl border shadow-sm sticky top-4 z-30 transition-all">
        <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                Bulk Product Creator
                <Badge variant="secondary" className="text-xs font-normal">
                    {rows.length === 1 ? "1 - Item" : `${rows.length} - Items`}
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
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
             {/* Test Generator Dialog */}
             <Dialog open={showTestModal} onOpenChange={setShowTestModal}>
                <DialogTrigger render={
                    <Button variant="outline" size="sm" disabled={isUploading}>
                        <Sparkles className="mr-2 h-4 w-4" /> Add Test Products
                    </Button>
                } />
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate Test Products</DialogTitle>
                        <DialogDescription>
                            Auto-populate rows with random data for testing. You can set a single image for all test rows.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                        <Field>
                            <FieldLabel>Number of Products</FieldLabel>
                            <Input 
                                type="number" 
                                min="1" 
                                max="50" 
                                value={testCount} 
                                onChange={(e) => setTestCount(parseInt(e.target.value) || 0)} 
                            />
                        </Field>
                        
                        <Field>
                            <FieldLabel>Test Image (Optional)</FieldLabel>
                            <Input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setTestImage(e.target.files?.[0] || null)}
                            />
                        </Field>
                    </div>

                    <DialogFooter>
                        <DialogClose render={<Button variant="outline">Cancel</Button>} />
                        <Button onClick={generateTestProducts} disabled={testCount < 1}>
                            Generate
                        </Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
            
             <Button variant="ghost" size="sm" onClick={clearCompleted} disabled={isUploading || successCount === 0} className="text-muted-foreground hover:text-foreground">
                <Eraser className="mr-2 h-4 w-4" /> Clear Completed
            </Button>
            
            <Button variant="ghost" size="sm" onClick={handleClearAll} disabled={isUploading} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                <Trash2 className="mr-2 h-4 w-4" /> Clear All
            </Button>

            <div className="w-px h-6 bg-border mx-1 hidden xl:block"></div>

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

      {isUploading && (
          <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }} 
              />
          </div>
      )}

      {/* --- Card List Layout --- */}
      <div className="space-y-4">
        {rows.map((row, index) => {
            const isDone = row.status === "success";
            const isError = row.status === "error";
            const isPending = row.status === "pending";

            return (
                <div 
                    key={row.id} 
                    className={`
                        group relative overflow-visible flex flex-col md:flex-row gap-6 p-6 rounded-xl border bg-card shadow-sm transition-all
                        ${isDone ? "border-green-200 bg-green-50/30 dark:bg-green-900/20" : "hover:shadow-md"}
                        ${isError ? "border-red-300 bg-red-50/30 dark:bg-red-900/20" : ""}
                    `}
                >
                    {/* Status Strip */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${
                        isDone ? "bg-green-500" : isError ? "bg-red-500" : isPending ? "bg-blue-500" : "bg-muted"
                    }`} />

                    {/* Left: Image Upload */}
                    <div className="shrink-0">
                         <div className="w-full md:w-24 h-24 relative">
                             <input 
                                 type="file" 
                                 id={`file-${row.id}`}
                                 accept="image/*"
                                 className="hidden"
                                 disabled={isDone || isPending}
                                 onChange={(e) => {
                                     const file = e.target.files?.[0] || null;
                                     updateRow(row.id, "imageFile", file);
                                 }}
                             />
                             <label 
                                 htmlFor={`file-${row.id}`}
                                 className={`
                                     flex flex-col items-center justify-center w-full h-full rounded-lg border-2 border-dashed
                                     cursor-pointer transition-colors
                                     ${row.imageFile ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-muted hover:border-primary hover:bg-muted/50"}
                                     ${(isDone || isPending) ? "pointer-events-none opacity-60" : ""}
                                 `}
                             >
                                 {row.imageFile ? (
                                    <div className="text-center p-2">
                                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                        <p className="text-xs text-green-700 dark:text-green-400 font-medium truncate max-w-[140px]">
                                            {row.imageFile.name}
                                        </p>
                                        <p className="text-[10px] text-green-600">Click to change</p>
                                    </div>
                                 ) : (
                                    <div className="text-center text-muted-foreground">
                                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <span className="text-xs font-medium">Upload</span>
                                    </div>
                                 )}
                             </label>
                         </div>
                         <div className="mt-2 text-center">
                            <span className="text-sm font-medium text-muted-foreground block mb-1">Row #{index + 1}</span>
                            {isError && <Badge variant="destructive" className="text-[10px]">Failed</Badge>}
                            {isDone && <Badge className="bg-green-600 text-[10px]">Uploaded</Badge>}
                         </div>
                    </div>

                    {/* Right: Form Inputs */}
                    <div className="grow space-y-4">
                        
                        {/* Row 1: Title & Description */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <Input 
                                 value={row.title} 
                                 onChange={(e) => updateRow(row.id, "title", e.target.value)}
                                 placeholder="Product Title *"
                                 className="font-medium"
                                 disabled={isDone || isPending}
                             />
                             <Input 
                                value={row.description}
                                onChange={(e) => updateRow(row.id, "description", e.target.value)}
                                placeholder="Description"
                                disabled={isDone || isPending}
                            />
                        </div>

                        {/* Row 2: Grid Attributes */}
                        {/* 2 Cols Mobile, 4 Cols Laptop, 8 Cols Large Screen */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            
                            {/* 1. Price */}
                            <div className="col-span-1">
                                <Input 
                                    type="number" step="0.01"
                                    value={row.price} onChange={(e) => updateRow(row.id, "price", e.target.value)}
                                    placeholder="Price *"
                                    disabled={isDone || isPending}
                                />
                            </div>

                            {/* 2. Main Category */}
                            <div className="col-span-1">
                                <Combobox 
                                    items={MAIN_CATEGORIES} 
                                    value={row.mainCategory} 
                                    onValueChange={(val) => updateRow(row.id, "mainCategory", val as string)}
                                >
                                    <ComboboxInput placeholder="Main Category" className="w-full bg-background" disabled={isDone || isPending} />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No results.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            {/* 3. Sub Category */}
                            <div className="col-span-1">
                                <Combobox 
                                    items={row.mainCategory ? SUB_CATEGORIES[row.mainCategory] : []} 
                                    value={row.subCategory} 
                                    onValueChange={(val) => updateRow(row.id, "subCategory", val as string)}
                                >
                                    <ComboboxInput placeholder="Sub Category" className="w-full bg-background" disabled={!row.mainCategory || isDone || isPending} />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No results.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            {/* 4. Breeder */}
                            <div className="col-span-1">
                                <Combobox 
                                    items={BREEDER_OPTIONS} 
                                    value={row.breeder} 
                                    onValueChange={(val) => updateRow(row.id, "breeder", val as string)}
                                >
                                    <ComboboxInput placeholder="Breeder" className="w-full bg-background" disabled={isDone || isPending} />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No results.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                            {/* 5. Sex */}
                            <div className="col-span-1">
                                <Combobox 
                                    items={SEX_OPTIONS} 
                                    value={row.sex} 
                                    onValueChange={(val) => updateRow(row.id, "sex", val as string)}
                                >
                                    <ComboboxInput placeholder="Sex" className="w-full bg-background" disabled={isDone || isPending} />
                                    <ComboboxContent>
                                        <ComboboxEmpty>No results.</ComboboxEmpty>
                                        <ComboboxList>
                                            {(item) => (
                                                <ComboboxItem key={item} value={item}>{item}</ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxContent>
                                </Combobox>
                            </div>

                             {/* 6. Age */}
                             <div className="col-span-1">
                                <Input 
                                    type="number" 
                                    value={row.age} onChange={(e) => updateRow(row.id, "age", e.target.value)}
                                    placeholder="Age"
                                    disabled={isDone || isPending}
                                />
                            </div>

                            {/* 7. Size CM */}
                            <div className="col-span-1">
                                <Input 
                                    type="number" step="0.01"
                                    value={row.sizeCm} onChange={(e) => updateRow(row.id, "sizeCm", e.target.value)}
                                    placeholder="Size (cm)"
                                    disabled={isDone || isPending}
                                />
                            </div>

                            {/* 8. Size IN */}
                            <div className="col-span-1">
                                <Input 
                                    type="number" step="0.01"
                                    value={row.sizeIn} onChange={(e) => updateRow(row.id, "sizeIn", e.target.value)}
                                    placeholder="Size (in)"
                                    disabled={isDone || isPending}
                                />
                            </div>
                        </div>

                        {/* Error Message Display */}
                        {isError && (
                            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-2 rounded">
                                <AlertCircle className="h-4 w-4" />
                                <span>{row.errorMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Far Right: Delete Button */}
                    <div className="shrink-0 pt-1 flex md:items-start justify-end">
                         <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => removeRow(row.id)}
                            disabled={isPending}
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                        >
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </div>

                </div>
            );
        })}
      </div>
      
      {/* Footer Instructions */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg bg-muted/20">
         <Save className="h-4 w-4 text-blue-500" />
         <span>Progress saves automatically. Local storage clears only when all products upload successfully.</span>
      </div>
    </div>
  );
}