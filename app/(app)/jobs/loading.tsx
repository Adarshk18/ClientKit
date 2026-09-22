import { Spinner } from "@/components/spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner label="Loading jobs" className="h-6 w-6" />
    </div>
  );
}
