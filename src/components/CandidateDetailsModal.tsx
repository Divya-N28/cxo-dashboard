import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: {
    UserData: {
      Name: string;
      EmailId: string;
      PhoneNumber: string;
      EducationList: {
        InstituteName: string;
        Degree: string;
        EndYear: number;
      }[];
    };
    WorkData: {
      WorkDataList: {
        CompanyName: string;
        Role: string;
        StartDate: {
          Month: number;
          Day: number;
          Year: number;
        };
        EndDate: {
          Month: number;
          Day: number;
          Year: number;
        };
      }[];
      TotalExperience: number;
    };
    Source: {
      SourceCategory: string;
      SourceDrillDown1: string;
      SourceDrillDown2: string;
    };
    ResumeStage: {
      Name: string;
      Value: number;
    };
    Parent: {
      Name: string;
      JobCode: string;
    };
    ResumeUrl: string;
    UploadDateTime: string;
  }[];
  title?: string;
}

export default function CandidateDetailsModal({ 
  isOpen, 
  onClose, 
  candidates, 
  title = "Candidate Details" 
}: CandidateDetailsModalProps) {
  if (candidates.length === 0) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose} >
      <DialogContent className="w-full max-w-max max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Showing {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Upload Date</TableHead>
              <TableHead>Resume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <div>{candidate.UserData.Name}</div>
                  <div className="text-xs text-gray-500">{candidate.UserData.EmailId}</div>
                  <div className="text-xs text-gray-500">{candidate.UserData.PhoneNumber}</div>
                </TableCell>
                <TableCell>
                  <div>{candidate.Parent.Name}</div>
                  <div className="text-xs text-gray-500">{candidate.Parent.JobCode}</div>
                </TableCell>
                <TableCell>
                  <Badge variant={candidate.ResumeStage.Name === "Reject" ? "destructive" : "default"}>
                    {candidate.ResumeStage.Name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div>{candidate.Source.SourceCategory}</div>
                  {candidate.Source.SourceCategory === "Referral" && (
                    <div className="text-xs text-gray-500">By: {candidate.Source.SourceDrillDown2}</div>
                  )}
                </TableCell>
                <TableCell>
                  {candidate.WorkData.TotalExperience} months
                  {candidate.WorkData.WorkDataList.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Last: {candidate.WorkData.WorkDataList[0].CompanyName}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(candidate.UploadDateTime).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <a 
                    href={candidate.ResumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={16} />
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
} 