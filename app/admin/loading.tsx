import { Spinner } from "@/components/spinner";

export default function AdminLoading() {
  return (
    <div className="mx-auto flex max-w-6xl items-center justify-center px-4 py-16">
      <Spinner label="Loading admin" className="h-6 w-6" />
    </div>
  );
}
