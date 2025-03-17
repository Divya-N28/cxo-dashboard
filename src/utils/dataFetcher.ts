import axios from 'axios';
import { EStage } from '@/types/dashboard';

interface Job {
    JobId: string;
    JobName: string;
}

interface StageMapping {
    [key: string]: string;
}

interface ApiResponse {
    TotalFilteredCount: number;
    StagesCount: {
        [key: string]: number;
    };
}

interface ChannelData {
    name: string;
    value: number;
    active: number;
    rejected: number;
    percentage: string;
}

interface PipelineStage {
    stage: string;
    active: number;
    rejected: number;
}

interface MonthlyData {
    month: string;
    totalApplicants: number;
    processed: number;
    scheduled: number;
    attended: number;
    l1Select: number;
    l1Reject: number;
    noShow: number;
    l2Scheduled: number;
    l2Selected: number;
    l2Rejected: number;
    offer: number;
    processedToScheduled: string;
    l1NoShowRate: string;
    l1RejectionRate: string;
    l2RejectionRate: string;
    offerPercentage: string;
    channelData: ChannelData[];
    pipelineStages: PipelineStage[];
    totalRejected: number;
    totalOffers: number;
    activePipeline: number;
    stageConversionRates: {
        [key: string]: {
            selectionRate: string;
            rejectionRate: string;
        }
    };
}

const stageMapping: StageMapping = {
    "0": "Pool",
    "14": "HR Screening",
    "15": "Xobin Test",
    "9": "L1 Interview",
    "10": "L2 Interview",
    "11": "Final Round",
    "16": "HR Round",
    "17": "Pre Offer Documentation",
    "18": "Offer Approval",
    "5": "Offer",
    "19": "Nurturing Campaign",
    "6": "Hired",
    "1": "Reject"
};

  const l2SelectStages = [
    EStage.Final_Round,
    EStage.HR_Round,
    EStage.Pre_Offer_Documentation,
    EStage.Offer_Approval,
    EStage.Offer,
    EStage.Nurturing_Campaign,
    EStage.Hired
  ];

  const allStages = [
    EStage.Pool,
    EStage.HR_Screening,
    EStage.Xobin_Test,
    EStage.L1_Interview,
    EStage.L2_Interview,
    EStage.Final_Round,
    EStage.HR_Round,
    EStage.Pre_Offer_Documentation,
    EStage.Offer_Approval,
    EStage.Offer,
    EStage.Nurturing_Campaign,
    EStage.Hired
  ];

  const l1ScheduleStages = [
    EStage.L1_Interview,
    EStage.L2_Interview,
    EStage.Final_Round,
    EStage.HR_Round,
    EStage.Pre_Offer_Documentation,
    EStage.Offer_Approval,
    EStage.Offer,
    EStage.Nurturing_Campaign,
    EStage.Hired
  ];

const sourceTypes = [
    { SourceCategory: "JobBoards", SourceName: "naukri" },
    { SourceCategory: "JobBoards", SourceName: "linkedin" },
    { SourceCategory: "Referral", SourceName: "referral" },
    { SourceCategory: "RecruitmentPartners", SourceName: "" },
    { SourceCategory: "CareerPage", SourceName: "CareerPage" }
];

const API_TOKEN = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkEyRkExMDQyMjNCQUEzQkZGOUZGRjNFNUIzOTY3QzcxRUYzRkRERjRSUzI1NiIsIng1dCI6Im92b1FRaU82bzdfNV9fUGxzNVo4Y2U4XzNmUSIsInR5cCI6ImF0K2p3dCJ9.eyJpc3MiOiJodHRwczovL2lkZW50aXR5LnR1cmJvaGlyZS5jbyIsIm5iZiI6MTc0MjA1NzQwMiwiaWF0IjoxNzQyMDU3NDAyLCJleHAiOjE3NDIwNjEwMDIsImF1ZCI6Imh0dHBzOi8vdGhpZGVudGl0eXYyLmF6dXJld2Vic2l0ZXMubmV0L2NvcmUvcmVzb3VyY2VzIiwic2NvcGUiOlsiYXBpIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbInBhc3N3b3JkIl0sImNsaWVudF9pZCI6IlRILk12Yy5BcGkiLCJzdWIiOiI4OGFiOWJjMS0yMDY5LTQwYmMtOWMzMS0xNjlhMWY5ZGIzNzIiLCJhdXRoX3RpbWUiOjE3NDE4NzQ3OTAsImlkcCI6ImxvY2FsIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiY2hpdHJha2FubmFuLmI2Mzg3NTY1Mjk3MTQ3ODQwNDEiLCJlbWFpbCI6ImNoaXRyYWthbm5hbi5iQGlkZWFzMml0LmNvbSIsImVtYWlsX3ZlcmlmaWVkIjoiZmFsc2UiLCJyb2xlIjpbIkFkbWluIiwiU3VwZXJVc2VyIl0sImdpdmVuX25hbWUiOiJDaGl0cmFrYW5uYW4iLCJmYW1pbHlfbmFtZSI6IkIiLCJ6b25laW5mbyI6ImM5ZTQyODUwLWI2MjYtNDJiYi1hYzIyLTY2OWRmOTU5Njk0OSIsImp0aSI6IkQ5OEM3QUU4QUVDMEREQkU5RjIxQzM3OUI1MjgwNDBGIn0.MK9KsdImmzh7VrfU37mJ9rVVKRZcKoxWl8JZiNNhrw-bOK3TWt2rxTQpuz4PM35U-Fm_AFPQQpU0J-P-JPQTwp70aBT6Gkk8O7TZvHDdg-TA_FBan_1ujuD6xbp64F6XtgPa_W7_MYNAwI5NaQAABJtAtoCZSwJPDfyTgPjvwS0Wm6SmJPyijyUFk7SbB_ptrmQeRq4Z11e14TLkxRqun47Brcfy-gwYSIqvHNOmxtTUO8KbJMrVQJlsMQqX7R8pLuDYf9Fzc0UpWFLJ16hHNcrzlkSLImh-RkqdI2juI07RvvYiGdXNYs9YqvXVpHpFcalYgLuQBEOzJU0fEgsr3w";
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.turbohire.co/api/v3';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to add authorization token to all requests
apiClient.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${API_TOKEN}`;
    return config;
}, (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
});

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const getCacheKey = (jobId: string, startDate: string, endDate: string, status: number) => {
    return `${jobId}-${startDate}-${endDate}-${status}`;
};

async function fetchStageData(jobId: string, startDate: string, endDate: string, status: number): Promise<ApiResponse | null> {
    try {
        const cacheKey = getCacheKey(jobId, startDate, endDate, status);

        // Check cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
            return cachedData.data;
        }

        const payload = {
            SortByV2: {
                Key: "CalibrationScore",
                Order: 2
            },
            Keyword: "",
            AdvanceKeyword: "",
            OwnerIds: [],
            Sources: {
                Value: null,
                FilterType: 0
            },
            ParsedData: {
                Value: null,
                FilterType: 0
            },
            StageCategory: {
                Value: null,
                FilterType: 0
            },
            Experience: null,
            SkillSet: {
                Value: null,
                FilterType: 0
            },
            Location: {
                Value: null,
                FilterType: 0
            },
            JobIds: {
                Value: [jobId],
                FilterType: "EQUALS"
            },
            BankIds: {
                Value: null,
                FilterType: 0
            },
            UploadedDate: {
                Value: null,
                FilterType: 0
            },
            UpdatedDate: {
                Value: null,
                FilterType: 0
            },
            InstituteName: {
                Value: null,
                FilterType: 0
            },
            IdealCandidate: {
                Value: null,
                FilterType: 0
            },
            Qualification: {
                Value: null,
                FilterType: 0
            },
            Quality: {
                Value: null,
                FilterType: 0
            },
            Domain: {
                Value: null,
                FilterType: 0
            },
            CompanyName: {
                Value: null,
                FilterType: 0
            },
            CompanySize: {
                Value: null,
                FilterType: 0
            },
            IndustryType: {
                Value: null,
                FilterType: 0
            },
            CandidateResume: {
                Value: null,
                FilterType: "NONE"
            },
            ResumeUpdateStatus: null,
            Tags: {
                Value: null,
                FilterType: 0
            },
            CalibrationScore: {
                Start: 0,
                End: 100
            },
            EnquiryFilter: null,
            EvaluationFilter: null,
            InterviewFilter: null,
            AssessmentFilter: null,
            EngagementCategory: null,
            OnewayInterviewFilter: null,
            CTCCategory: null,
            CandidateAvailabilityCategory: null,
            Columns: [],
            View: 1,
            ScorecardSubmitter: null,
            InterviewStatus: null,
            InterviewerEmail: null,
            InterviewType: null,
            Date: null,
            Time: null,
            OrganizerEmail: null,
            InterviewLocation: null,
            CandidateListShare: null,
            CandidateListShareDate: null,
            StageEvaluationFilter: null,
            StageChangedDate: {
                Value: {
                    StartDate: startDate,
                    EndDate: endDate
                },
                FilterType: "IS_BETWEEN"
            },
            StageChangedBy: {
                Value: null,
                FilterType: 0
            },
            StageValue: status,
            FetchOnlyActiveCandidates: status === -1
        };

        const response = await apiClient.post(
            `/job/${jobId}/filteredcount`,
            payload
        );

        // Cache the response
        cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });

        return response.data;
    } catch (error) {
        // Return empty response instead of throwing
        return { TotalFilteredCount: 0, StagesCount: {} };
    }
}

async function fetchSourceData(jobId: string, startDate: string, endDate: string, sourceCategory: string, sourceName: string, status: number = -1): Promise<number> {
    try {
        const cacheKey = `source-${jobId}-${startDate}-${endDate}-${sourceCategory}-${sourceName}-${status}`;

        // Check cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
            return cachedData.data;
        }

        const payload = {
            Columns: [],
            Index: 0,
            CurrentParentIds: [],
            RetargetIds: null,
            OwnerIds: [],
            Offices: {
                FilterType: "NONE",
                Value: null
            },
            Keyword: null,
            ParsedData: null,
            AdvanceKeyword: null,
            BankIds: null,
            JobIds: null,
            Tags: null,
            Location: null,
            StageCategory: null,
            SkillSet: null,
            IdealCandidate: null,
            CandidateResume: null,
            ResumeUpdateStatus: null,
            Experience: null,
            Score: null,
            EvaluationScore: null,
            UploadedDate: null,
            LastActivityDate: null,
            UpdatedDate: null,
            InstituteName: null,
            Qualification: null,
            CompanyName: null,
            SourceV2: {
                Value: {
                    SourceCategory: [sourceCategory],
                    SourceName:  sourceName ? [sourceName] : null
                },
                FilterType: "EQUALS"
            },
            CustomFields: null,
            Quality: null,
            Domain: null,
            IndustryType: null,
            EnquiryFilter: null,
            AssessmentFilter: null,
            EvaluationFilter: null,
            StageEvaluationFilter: null,
            InterviewFilter: null,
            CalibrationScore: null,
            StageNames: null,
            UploadedDateV2: null,
            ResumeLink: null,
            UploadedDateNew: null,
            SortByV2: {
                Order: "DSC",
                Key: "CalibrationScore"
            },
            SortBy: "Newest",
            JobRole: null,
            EngagementCategory: null,
            CTCCategory: null,
            CandidateAvailabilityCategory: null,
            ShowActive: true,
            CandidateName: {
                FilterType: "NONE",
                Value: null
            },
            ExportEmail: "",
            ScorecardSubmitter: null,
            InterviewerEmail: null,
            InterviewType: null,
            Time: {
                FilterType: "NONE",
                Value: null
            },
            OrganizerEmail: null,
            InterviewLocation: null,
            InterviewStatus: null,
            OneWayInterviewFilter: null,
            StageChangedBy: null,
            CandidateListShareDate: null,
            CandidateListShare: null,
            Date: {
                Value: {
                    StartDate: startDate,
                    EndDate: endDate
                },
                FilterType: "IS_BETWEEN"
            },
            StageValue: status,
            FetchOnlyActiveCandidates: status === -1
        };
        const response = await apiClient.post(
            `/job/${jobId}/filteredcount`,
            payload
        );

        const count = response.data.TotalFilteredCount;

        // Cache the response
        cache.set(cacheKey, {
            data: count,
            timestamp: Date.now()
        });

        return count;
    } catch (error) {
        // Return 0 instead of throwing
        return 0;
    }
}

function aggregateStageData(activeData: ApiResponse | null, rejectedData: ApiResponse | null): {
    active: { [key: string]: number };
    rejected: { [key: string]: number };
} {
    const result = {
        active: {} as { [key: string]: number },
        rejected: {} as { [key: string]: number }
    };

    if (activeData?.StagesCount) {
        Object.entries(activeData.StagesCount).forEach(([stage, count]) => {
            const stageName = stageMapping[stage] || stage;
            result.active[stageName] = (result.active[stageName] || 0) + count;
        });
    }

    if (rejectedData?.StagesCount) {
        Object.entries(rejectedData.StagesCount).forEach(([stage, count]) => {
            const stageName = stageMapping[stage] || stage;
            result.rejected[stageName] = (result.rejected[stageName] || 0) + count;
        });
    }

    return result;
}

// Add error handling utility
const handleApiError = (error: unknown, context: string) => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            console.error('Authentication failed. Please check your API token.');
        } else if (error.response?.status === 403) {
            console.error('Access forbidden. Please check your permissions.');
        }
        console.error(`${context}:`, {
            status: error.response?.status,
            message: error.message
        });
    }
};

// Helper function to calculate percentage and handle NaN
const calculatePercentage = (numerator: number, denominator: number): string => {
    const percentage = Math.round((numerator / (denominator || 1)) * 100);
    return `${percentage || 0}%`;
};

export async function generateMonthlyData(jobs: Job[]): Promise<MonthlyData[]> {
    try {
        if (!API_TOKEN) {
            return []; // Return empty array instead of throwing
        }

        if (!jobs || jobs.length === 0) {
            return [];
        }

        const monthlyData: MonthlyData[] = [];
        const batchSize = 3; // Process 3 jobs at a time

        const currentDate = new Date();
        const months = Array.from(
            { length: currentDate.getMonth() + 1 },
            (_, index) => {
                const date = new Date(currentDate);
                date.setMonth(date.getMonth() - index);

                return {
                    month: date.toLocaleString('default', { month: 'short' }),
                    startDate: new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)).toISOString(),
                    endDate: new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString()
                };
            }
        );

        for (const monthData of months) {
            let totalProcessed = 0;
            let totalApplicants = 0;
            const stageTotals = {
                active: {} as { [key: string]: number },
                rejected: {} as { [key: string]: number }
            };

            // Process jobs in batches with error handling
            for (let i = 0; i < jobs.length; i += batchSize) {
                try {
                    const batch = jobs.slice(i, i + batchSize);
                    await Promise.all(
                        batch.map(async (job) => {
                            try {
                                const [activeData, rejectedData] = await Promise.all([
                                    fetchStageData(job.JobId, monthData.startDate, monthData.endDate, -1),
                                    fetchStageData(job.JobId, monthData.startDate, monthData.endDate, 1)
                                ]);

                                totalProcessed = (activeData?.TotalFilteredCount || 0) + (rejectedData?.TotalFilteredCount || 0);
                                const jobStageTotals = aggregateStageData(activeData, rejectedData);

                                // Combine with overall totals
                                Object.entries(jobStageTotals.active).forEach(([stage, count]) => {
                                    stageTotals.active[stage] = (stageTotals.active[stage] || 0) + count;
                                });
                                Object.entries(jobStageTotals.rejected).forEach(([stage, count]) => {
                                    stageTotals.rejected[stage] = (stageTotals.rejected[stage] || 0) + count;
                                });
                            } catch (error) {
                                // Continue with next job if one fails
                            }
                        })
                    );
                } catch (error) {
                    // Continue with next batch if one fails
                }

                // Add a small delay between batches to prevent rate limiting
                if (i + batchSize < jobs.length) {
                    await delay(5000);
                }
            }

            // Calculate total applicants (sum of all stages)
            totalApplicants = allStages.reduce((sum, stage) => sum + (stageTotals.active[stage] || 0) + (stageTotals.rejected[stage] || 0), 0);
            // Fetch source data
            const channelData: ChannelData[] = [];

            for (const source of sourceTypes) {
                let activeCount = 0;
                let rejectedCount = 0;

                for (const job of jobs) {
                    // Fetch active candidates
                    const activeSourceCount = await fetchSourceData(
                        job.JobId,
                        monthData.startDate,
                        monthData.endDate,
                        source.SourceCategory,
                        source.SourceName,
                        -1
                    );

                    // Fetch rejected candidates
                    const rejectedSourceCount = await fetchSourceData(
                        job.JobId,
                        monthData.startDate,
                        monthData.endDate,
                        source.SourceCategory,
                        source.SourceName,
                        1
                    );

                    activeCount += activeSourceCount;
                    rejectedCount += rejectedSourceCount;
                }

                channelData.push({
                    name: source.SourceName.charAt(0).toUpperCase() + source.SourceName.slice(1),
                    value: activeCount + rejectedCount,
                    active: activeCount,
                    rejected: rejectedCount,
                    percentage: calculatePercentage(activeCount + rejectedCount, totalApplicants)
                });
            }

            // Create pipeline stages array
            const pipelineStages: PipelineStage[] = Object.entries(stageMapping).map(([_, stageName]) => ({
                stage: stageName,
                active: stageTotals.active[stageName] || 0,
                rejected: stageTotals.rejected[stageName] || 0
            }));

            const l1toHireActive = l1ScheduleStages.reduce((sum, stage) => sum + (stageTotals.active[stage] || 0), 0);
            const l1toHireRejected = l1ScheduleStages.reduce((sum, stage) => sum + (stageTotals.rejected[stage] || 0), 0);
            
            // Calculate metrics
            const l1Reject = stageTotals.rejected[EStage.L1_Interview] || 0;
            const l2Rejected = stageTotals.rejected[EStage.L2_Interview] || 0;

            const processed = (stageTotals.active[EStage.Pool] || 0) + (stageTotals.active[EStage.HR_Screening] || 0) + (stageTotals.rejected[EStage.Pool] || 0) + (stageTotals.rejected[EStage.HR_Screening] || 0);
            const scheduled = l1toHireActive + l1toHireRejected;
            const attended =  scheduled - (stageTotals.active[EStage.L1_Interview] || 0);
            
            const noShow =  scheduled - attended;

            const l2Selected = l2SelectStages.reduce((sum, stage) => sum + (stageTotals.active[stage] || 0), 0);
            const l1Select = l2Selected + (stageTotals.active[EStage.L2_Interview] || 0) + (stageTotals.rejected[EStage.L2_Interview] || 0);
            const l2Scheduled = l1Select;
            const l2attended =  l2Scheduled + (stageTotals.rejected[EStage.L2_Interview] || 0);

            const l2noShow =  l2Scheduled - attended;

            const totalRejected = allStages.reduce((sum, stage) => sum + (stageTotals.rejected[stage] || 0), 0);
            const offer = (stageTotals.active[EStage.Offer] || 0);
            const totalOffers = (stageTotals.active[EStage.Offer] || 0) + (stageTotals.active[EStage.Nurturing_Campaign] || 0) + (stageTotals.active[EStage.Hired] || 0);
            const activePipeline = Math.abs(allStages.reduce((sum, stage) => sum + (stageTotals.active[stage] || 0), 0) - totalOffers);

            // Calculate rates
            const processedToScheduled = calculatePercentage(scheduled, totalApplicants);
            const l1NoShowRate = calculatePercentage(noShow, scheduled);
            const l1RejectionRate = calculatePercentage(l1Reject, scheduled);
            const l2RejectionRate = calculatePercentage(l2Rejected, l2Scheduled);
            const offerPercentage = calculatePercentage(offer, scheduled);
            
            // Calculate stage-wise conversion rates
            const stageConversionRates:any = {};
            
            // For each stage, calculate selection and rejection rates
            allStages.forEach((stage, index) => {
                const selection = allStages.slice(allStages.indexOf(stage) + 1).reduce((sum, stage) => sum + (stageTotals.active[stage] || 0), 0) + allStages.slice(allStages.indexOf(stage) + 1).reduce((sum, stage) => sum + (stageTotals.rejected[stage] || 0), 0);
                const rejection = stageTotals.rejected[stage] || 0;
                const total = selection + rejection;
                let selectionRate = "0%";
                let rejectionRate = "0%";

                selectionRate = calculatePercentage(selection, total);                
                rejectionRate = calculatePercentage(rejection, total);
                console.log("stage", stage, "selectionRate", selectionRate, "rejectionRate", rejectionRate, "total", total);

                stageConversionRates[stage] = {
                    selectionRate: selectionRate,
                    rejectionRate: rejectionRate,
                };
            });

            monthlyData.push({
                month: monthData.month,
                totalApplicants,
                processed,
                scheduled,
                attended,
                l1Select,
                l1Reject,
                noShow,
                l2Scheduled,
                l2Selected,
                l2Rejected,
                offer,
                processedToScheduled,
                l1NoShowRate,
                l1RejectionRate,
                l2RejectionRate,
                offerPercentage,
                channelData,
                pipelineStages,
                totalRejected,
                activePipeline,
                totalOffers,
                stageConversionRates
            });
        }
        return monthlyData;
    } catch (error) {
        // Return empty array instead of throwing
        return [];
    }
} 