import { HiveApp } from "@/components/hive-app";
import { CATALOG_RELEASES } from "@/lib/catalog-seeds";

export default function Home() {
  return <HiveApp initialReleases={CATALOG_RELEASES} />;
}
