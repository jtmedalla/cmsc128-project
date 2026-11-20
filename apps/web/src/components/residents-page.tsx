import { columns, ResidentData } from '@/components/residents-data-table';
import { ResidentTable } from '@/components/residents-data-table';

export function ResidentsPage() {
  const dateNow = new Date();
  const residentSamples: ResidentData[] = [
    { name: 'John Doe', lastMessaged: new Date(dateNow.getTime() - 600000) }, // 10 mins ago
    { name: 'Jane Smith', lastMessaged: new Date(dateNow.getTime() - 7200000) }, // 2 hours ago
    {
      name: 'Alice Johnson',
      lastMessaged: new Date(dateNow.getTime() - 10800000),
    }, // 3 hours ago
  ];
  const data = residentSamples;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Residents Directory</h1>
      <ResidentTable columns={columns} data={data} />
    </div>
  );
}
