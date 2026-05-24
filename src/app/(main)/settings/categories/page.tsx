import { getCategories } from "@/queries/categories";
import { CategoryManager } from "@/components/category-manager";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <CategoryManager categories={categories} />
    </div>
  );
}
