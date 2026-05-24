"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createCategory,
  renameCategory,
  deleteCategory,
  toggleCategoryVisibility,
} from "@/actions/categories";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, EyeOff, Check, X } from "lucide-react";

export function CategoryManager({ categories }: { categories: Category[] }) {
  const t = useTranslations();
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function handleAdd() {
    if (!newName.trim()) return;
    const fd = new FormData();
    fd.set("name", newName.trim());
    const result = await createCategory(fd);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("category.added"));
      setNewName("");
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("name", editName.trim());
    const result = await renameCategory(fd);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(t("category.renamed"));
      setEditingId(null);
    }
  }

  async function handleDelete(id: string) {
    const result = await deleteCategory(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      const msg =
        result.movedCount && result.movedCount > 0
          ? t("category.transactionsMoved", { count: result.movedCount })
          : t("category.deleted");
      toast.success(msg);
    }
  }

  async function handleToggleVisibility(id: string) {
    const result = await toggleCategoryVisibility(id);
    if (result.error) toast.error(result.error);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("category.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={t("category.namePlaceholder")}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {t("category.add")}
          </Button>
        </div>

        <div className="divide-y">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-2 py-3"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-1 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleRename(cat.id)
                      }
                      className="h-8"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => handleRename(cat.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setEditingId(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span
                      className={
                        cat.isHidden ? "text-muted-foreground line-through" : ""
                      }
                    >
                      {cat.name}
                    </span>
                    {cat.isDefault && (
                      <Badge variant="secondary">{t("category.default")}</Badge>
                    )}
                    {cat.isHidden && (
                      <Badge variant="outline">{t("category.hidden")}</Badge>
                    )}
                  </>
                )}
              </div>

              {editingId !== cat.id && (
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => handleToggleVisibility(cat.id)}
                  >
                    {cat.isHidden ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>

                  {cat.isDefault ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      disabled
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                          />
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("category.deleteConfirm")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("category.deleteDescription")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("common.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(cat.id)}
                          >
                            {t("common.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
