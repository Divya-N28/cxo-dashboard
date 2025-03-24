export interface ChannelData {
    name: string;
    value: number;
    percentage: string;
  }
  
  export interface MonthlyData {
    month: string;
    offersCount: number;
    processed: number;
    scheduled: number;
    attended: number;
    l1Select: number;
    l1Reject: number;
    noShow: number;
    l2Scheduled: number;
    l2Selected: number;
    l2Rejected: number;
    inProcess: number;
    offer: number;
    processedToScheduled: string;
    l1NoShowRate: string;
    l1RejectionRate: string;
    l2RejectionRate: string;
    offerPercentage: string;
    channelData: ChannelData[];
  }


  export enum EStage {
    Pool = 'Pool',
    HR_Screening = 'HR Screening',
    Xobin_Test = 'Xobin Test',
    Panel_Screening = 'Panel Screening',
    L1_Interview = 'L1 Interview',
    L2_Interview = 'L2 Interview',
    Final_Round = 'Final Round',
    Pre_Offer_Documentation = 'Pre Offer Documentation',
    HR_Round = 'HR Round',
    Offer_Approval = 'Offer Approval',
    Offer = 'Offer',
    Nurturing_Campaign = 'Nurturing Campaign',
    Hired = 'Hired',
    Reject = 'Reject'
}