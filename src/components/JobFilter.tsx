import React from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface JobFilterProps {
  jobs: { id: string; name: string; code: string }[];
  selectedJobs: string[];
  setSelectedJobs: (jobs: string[]) => void;
}

export default function JobFilter({ jobs = [], selectedJobs = [], setSelectedJobs }: JobFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  // Ensure jobs is an array
  const safeJobs = Array.isArray(jobs) ? jobs : [];

  const toggleJob = (jobId: string) => {
    if (selectedJobs.includes(jobId)) {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    } else {
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  const selectAll = () => {
    setSelectedJobs(safeJobs.map(job => job.id));
  };

  const clearAll = () => {
    setSelectedJobs([]);
  };

  // Filter jobs based on search query
  const filteredJobs = safeJobs.filter(job => 
    job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
        >
          {selectedJobs.length === 0
            ? "All Jobs"
            : selectedJobs.length === 1
            ? safeJobs.find(job => job.id === selectedJobs[0])?.name || "1 Job"
            : `${selectedJobs.length} Jobs Selected`}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <div className="flex items-center border-b p-2">
          <Search className="h-4 w-4 mr-2 opacity-50" />
          <Input 
            placeholder="Search jobs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        
        <div className="flex justify-between p-2 border-b">
          <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
          <Button variant="ghost" size="sm" onClick={clearAll}>Clear</Button>
        </div>
        
        <div className="max-h-[300px] overflow-auto py-1">
          {filteredJobs.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">No job found.</div>
          ) : (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                onClick={() => toggleJob(job.id)}
                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
              >
                <div className={cn(
                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  selectedJobs.includes(job.id) ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {selectedJobs.includes(job.id) && (
                    <Check className="h-3 w-3" />
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate">{job.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{job.code}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
} 