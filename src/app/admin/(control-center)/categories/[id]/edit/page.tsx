import { CategoryEditor } from "@/components/admin/category-editor";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CategoryEditor id={id} />;
}
