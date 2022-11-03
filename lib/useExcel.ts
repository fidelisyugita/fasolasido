import useSWR from "swr";
import type { Excel } from "pages/api/excel";

export default function UseExcel() {
  const { data: excel, mutate: mutateExcel } = useSWR<Excel>(`/api/excel`);

  return { excel, mutateExcel };
}
