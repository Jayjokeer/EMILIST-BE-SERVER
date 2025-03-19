"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const jobService = __importStar(require("../services/job.service"));
const projectService = __importStar(require("../services/project.service"));
const date_fns_1 = require("date-fns");
const utility_1 = require("../utils/utility");
const authService = __importStar(require("../services/auth.service"));
const templates_1 = require("../utils/templates");
const send_email_1 = require("../utils/send_email");
// cron.schedule('*/20 * * * * *', async () => {
node_cron_1.default.schedule('0 0 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Running daily recurring job check...');
    try {
        const today = new Date();
        // today.setHours(0, 0, 0, 0);
        console.log(today);
        const recurringJobs = yield jobService.findRecurringJobsDue(today);
        console.log(recurringJobs);
        for (const recurring of recurringJobs) {
            if (recurring.endDate < today) {
                console.log(`Skipping recurring job ${recurring._id} as endDate has passed.`);
                continue;
            }
            const originalJob = yield jobService.fetchJobByIdWithUserId(String(recurring.jobId));
            if (!originalJob) {
                console.log(`Original job ${recurring.jobId} not found. Skipping.`);
                continue;
            }
            const newJobData = Object.assign(Object.assign({}, originalJob.toObject()), { userId: originalJob.userId });
            delete newJobData._id;
            const newJob = yield jobService.createJob(newJobData);
            const projectPayload = {
                job: newJob._id,
                user: originalJob.acceptedApplicationId._id,
                creator: originalJob.userId,
                directJobStatus: 'pending',
            };
            const newProject = yield projectService.createProject(projectPayload);
            newJob.applications = [String(newProject._id)];
            newJob.acceptedApplicationId = String(newProject._id);
            yield newJob.save();
            recurring.childJobs.push(newJob._id);
            recurring.nextMaintenanceDate = (0, utility_1.calculateNextMaintenanceDate)(today, recurring.frequency);
            yield recurring.save();
            console.log(`Created new job ${newJob._id} from recurring job ${recurring._id}`);
        }
        const reminders = yield jobService.findRecurringJobsWithReminders(today);
        for (const reminder of reminders) {
            const job = yield jobService.fetchJobById(String(reminder.jobId));
            if (!job)
                continue;
            const user = yield authService.findUserWithoutDetailsById(job.userId);
            if (!user)
                continue;
            const formattedDate = (0, date_fns_1.format)(reminder.startDate, 'yyyy-MM-dd');
            const { subject, html } = (0, templates_1.generateReminderEmail)(user.userName, formattedDate);
            yield (0, send_email_1.sendEmail)(user.email, subject, html);
            console.log(`Sent reminder for recurring job ${reminder._id}`);
        }
    }
    catch (error) {
        console.error('Error in recurring job cron:', error);
    }
}));
