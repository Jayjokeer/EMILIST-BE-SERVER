import cron from 'node-cron';
import * as jobService from '../services/job.service';
import * as projectService from '../services/project.service';
import { format } from 'date-fns';
import { calculateNextMaintenanceDate } from '../utils/utility';
import { IProject } from '../interfaces/project.interface';
import * as authService from '../services/auth.service';
import { generateReminderEmail } from '../utils/templates';
import { sendEmail } from '../utils/send_email';

cron.schedule('0 0 * * *', async () => {
  console.log('Running daily recurring job check...');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recurringJobs = await jobService.findRecurringJobsDue(today);

    for (const recurring of recurringJobs) {
      if (recurring.endDate < today) {
        console.log(`Skipping recurring job ${recurring._id} as endDate has passed.`);
        continue;
      }

      const originalJob = await jobService.fetchJobByIdWithUserId(String(recurring.jobId));
      if (!originalJob) {
        console.log(`Original job ${recurring.jobId} not found. Skipping.`);
        continue;
      }

      const newJobData = { ...originalJob.toObject(), userId: originalJob.userId };
    //   delete newJobData._id; 

      const newJob = await jobService.createJob(newJobData);

      const projectPayload = {
        job: newJob._id,
        user: originalJob.acceptedApplicationId._id,
        creator: originalJob.userId,
        directJobStatus: 'pending',
      } as IProject;

      const newProject = await projectService.createProject(projectPayload);

      newJob.applications = [String(newProject._id)];
      newJob.acceptedApplicationId = String(newProject._id);
      await newJob.save();

      recurring.childJobs.push(newJob._id);
      recurring.nextMaintenanceDate = calculateNextMaintenanceDate(today, recurring.frequency);
      await recurring.save();

      console.log(`Created new job ${newJob._id} from recurring job ${recurring._id}`);
    }

    const reminders = await jobService.findRecurringJobsWithReminders(today);
    for (const reminder of reminders) {
        const job = await jobService.fetchJobById(String(reminder.jobId));
        if (!job) continue;

      const user = await authService.findUserWithoutDetailsById(job.userId);
      if (!user) continue;

      const formattedDate = format( reminder.startDate, 'yyyy-MM-dd');
      const { subject, html } = generateReminderEmail(user.userName, formattedDate);

      await sendEmail(user.email, subject, html);
      console.log(`Sent reminder for recurring job ${ reminder._id}`);
    }

  } catch (error) {
    console.error('Error in recurring job cron:', error);
  }
});
