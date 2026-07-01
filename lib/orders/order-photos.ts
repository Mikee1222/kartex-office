import { createClient } from "@/lib/supabase/client";

export type OrderBoxPhoto = {
  id: string;
  orderId: string;
  photoUrl: string;
  photoType: string;
  boxNumber: number | null;
  createdAt: string;
};

type OrderPhotoRow = {
  id: string;
  order_id: string;
  photo_url: string;
  photo_type: string;
  box_number: number | null;
  created_at: string;
};

function mapOrderPhotoRow(row: OrderPhotoRow): OrderBoxPhoto {
  return {
    id: row.id,
    orderId: row.order_id,
    photoUrl: row.photo_url,
    photoType: row.photo_type,
    boxNumber: row.box_number,
    createdAt: row.created_at,
  };
}

export async function fetchBoxPhotos(orderId: string): Promise<OrderBoxPhoto[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("order_photos")
    .select("*")
    .eq("order_id", orderId)
    .eq("photo_type", "box")
    .order("box_number", { ascending: true, nullsFirst: false });

  if (error || !data) return [];
  return (data as OrderPhotoRow[]).map(mapOrderPhotoRow);
}
