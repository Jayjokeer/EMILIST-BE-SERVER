/**
 * Emilist API - Swagger / OpenAPI 3.0 specification
 * -------------------------------------------------
 * This document describes all endpoints under the JOBS section.
 * The interactive UI is served at:  GET /api-docs
 *
 * Auth: protected endpoints require an `Authorization: Bearer <token>` header.
 *       Obtain a token from `POST /api/v1/auth/login`.
 */
export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Emilist API",
    version: "1.0.0",
    description: `Backend API for the Emilist platform.

## Jobs section
Interactive documentation & examples for every endpoint under \`/api/v1/jobs\`.

### Authentication
1. Call \`POST /api/v1/auth/login\` with \`{ "email": "...", "password": "..." }\`.
2. Copy the returned \`token\` (JWT).
3. Click **Authorize** (top right) and paste it as \`Bearer <token>\`.

### File uploads
Endpoints marked as \`multipart/form-data\` expect the file(s) under the field
\`files\` (multiple) or \`image\` (single) and all other fields as form values.
`,
  },
  servers: [
    { url: "http://localhost:7000/api/v1", description: "Local development server" },
  ],
  tags: [
    {
      name: "Jobs",
      description: "Everything related to creating, listing, applying to and managing jobs.",
    },
    {
      name: "Dashboard",
      description: "Home/overview screen for the logged-in user.",
    },
  ],
  security: [{ bearerAuth: [] }],
  paths: {
    "/dashboard/overview": {
      get: {
        tags: ["Dashboard"],
        summary: "Fetch the logged-in user's dashboard overview",
        description: `Powers the "Hello, {name}" home screen: new job applications, upcoming
payments, job completion rate, a job-completion donut breakdown, and a spotlighted service
provider.

Notes on the metrics:
- \`newJobApplications.count\` is the number of applications currently pending review across
  the user's posted jobs; \`newToday\`/\`percentChangeToday\` compare applications received today
  vs. yesterday.
- \`upcomingPayments\` sums unpaid milestone amounts (grouped by currency) whose computed due
  date falls within the next 7 days, across the user's active/paused jobs.
- \`jobCompletionRate.percentChangeToday\` is a percentage-**point** change vs. this time
  yesterday (not a relative percent).
- \`jobCompletion\` gives completed/pending/overdue as percentages of all the user's jobs (for
  the donut chart legend).
- \`spotlight\` is the highest-rated Business profile (by average review rating, tie-broken by
  review count) other than the user's own — a "top-rated now" pick, not a stored weekly rotation.`,
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Dashboard overview",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    user: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", fullName: "Toks Williams", uniqueId: "Toks13356", displayImage: "https://.../avatar.jpg" },
                    newJobApplications: { count: 32, newToday: 4, percentChangeToday: 13 },
                    upcomingPayments: { amount: 3200000, currency: "NGN", totalsByCurrency: { NGN: 3200000 }, period: "this week" },
                    jobCompletionRate: { rate: 85, percentChangeToday: -4 },
                    jobCompletion: { completed: 48, pending: 41, overdue: 11, period: "This week" },
                    spotlight: {
                      businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                      businessName: "Cole Furniture Works",
                      services: ["Furniture Maker"],
                      expertType: "verified",
                      user: { _id: "64e1a2b3c4d5e6f7a8b9c0d2", fullName: "Richard Cole E.", userName: "richardcole", displayImage: "https://.../richard.jpg", level: "three" },
                      averageRating: 4.8,
                      totalReviews: 380,
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Unauthorized - missing or invalid token", content: { "application/json": { example: { message: "Kindly login" } } } },
          "404": { description: "User not found" },
          "500": { description: "Server error" },
        },
      },
    },
    "/jobs/fetch-all-jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch all jobs (public marketplace listing)",
        description: `Returns a paginated list of all jobs, with optional filters matching the marketplace
"Find jobs" screen: job category, payment range, job location, notice period (job urgency),
experience level, and employer (poster) rating.

Each job in the response includes \`applicantsCount\`, \`milestonesCount\`, \`liked\` (when
\`userId\` is passed) and \`posterRating\` (\`{ averageRating, totalReviews }\`, derived from the
poster's Business reviews, 0/0 when they don't run a Business).`,
        security: [],
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 }, description: "Page number" },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 }, description: "Items per page" },
          { name: "search", in: "query", required: false, schema: { type: "string" }, description: "Free-text search" },
          { name: "title", in: "query", required: false, schema: { type: "string" }, description: "Filter by title" },
          { name: "location", in: "query", required: false, schema: { type: "string" }, description: "Filter by a single location (legacy)" },
          { name: "category", in: "query", required: false, schema: { type: "string" }, description: "Filter by a single job category (legacy)" },
          { name: "service", in: "query", required: false, schema: { type: "string" }, description: "Filter by service" },
          { name: "userId", in: "query", required: false, schema: { type: "string" }, description: "Requesting user's id - used to compute `liked` and exclude muted jobs" },
          { name: "categories", in: "query", required: false, schema: { type: "string" }, description: "JOB CATEGORY filter (multi-select). Comma-separated or repeated, e.g. `categories=Plumber,Carpenter`" },
          { name: "locations", in: "query", required: false, schema: { type: "string" }, description: "JOB LOCATION filter (multi-select). Comma-separated or repeated, e.g. `locations=Yaba,Shomolu`" },
          { name: "minBudget", in: "query", required: false, schema: { type: "number" }, description: "PAYMENT range - minimum amount (checked across budget/totalBudget/estimatedBudget/recurringBudget)" },
          { name: "maxBudget", in: "query", required: false, schema: { type: "number" }, description: "PAYMENT range - maximum amount" },
          { name: "jobUrgency", in: "query", required: false, schema: { type: "string", enum: ["right_now", "in_future", "regularly"] }, description: "NOTICE PERIOD filter" },
          { name: "experienceLevel", in: "query", required: false, schema: { type: "string" }, description: "EXPERIENCE LEVEL filter (multi-select). Comma-separated or repeated, e.g. `experienceLevel=intermediate,senior`" },
          { name: "minRating", in: "query", required: false, schema: { type: "number" }, description: "EMPLOYER RATING filter - minimum average rating (1-5) of the job poster's Business profile" },
        ],
        responses: {
          "200": {
            description: "Paginated list of jobs",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    currentPage: 1,
                    totalPages: 1,
                    totalJobs: 1,
                    jobs: [
                      {
                        _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                        title: "Fix leaking kitchen sink",
                        description: "Kitchen sink has been leaking for 2 days.",
                        jobCategory: "Plumbing",
                        service: "Repair",
                        jobUrgency: "right_now",
                        location: { address: "12 Admiralty Way, Lekki, Lagos" },
                        type: "regular",
                        status: "pending",
                        userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", userName: "arthurphillips", fullName: "Arthur Phillips", profileImage: "https://.../avatar.jpg", level: "intermediate" },
                        applicantsCount: 13,
                        milestonesCount: 3,
                        liked: false,
                        posterRating: { averageRating: 4.2, totalReviews: 51 },
                      },
                    ],
                  },
                },
              },
            },
          },
          "500": { description: "Server error" },
        },
      },
    },
    "/jobs/fetch-listed-jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch jobs listed by the current user",
        description: "Returns a paginated list of jobs created by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", required: false, schema: { type: "string" } },
          { name: "title", in: "query", required: false, schema: { type: "string" } },
          { name: "location", in: "query", required: false, schema: { type: "string" } },
          { name: "category", in: "query", required: false, schema: { type: "string" } },
          { name: "service", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Paginated list of the user's jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, totalJobs: 1, jobs: [] } } } } },
          "401": { description: "Unauthorized", content: { "application/json": { example: { message: "Kindly login" } } } },
          "500": { description: "Server error" },
        },
      },
    },
    "/jobs/fetch-job-by-id": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch a single job by id (public)",
        description: `Returns full details of a single job, including populated user/application info,
the milestones panel (each with computed \`dueDate\`), \`applicantsCount\`, and the job poster's
review summary and comments (\`reviews\`: average rating, star distribution, and a paginated list
of reviews/comments pulled from the poster's Business profile).`,
        security: [],
        parameters: [
          { name: "id", in: "query", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
          { name: "reviewsPage", in: "query", required: false, schema: { type: "integer", default: 1 }, description: "Page number for the poster's reviews/comments list" },
          { name: "reviewsLimit", in: "query", required: false, schema: { type: "integer", default: 5 }, description: "Items per page for the poster's reviews/comments list" },
        ],
        responses: {
          "200": {
            description: "Job details",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    job: {
                      _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                      title: "Fix leaking kitchen sink",
                      description: "Kitchen sink has been leaking for 2 days.",
                      jobCategory: "Plumbing",
                      service: "Repair",
                      jobUrgency: "right_now",
                      location: { address: "12 Admiralty Way, Lekki, Lagos", lat: 6.4281, lng: 3.4219 },
                      type: "regular",
                      budget: 85000,
                      status: "active",
                      startDate: "2025-01-10T09:30:00.000Z",
                      dueDate: "2025-01-24T09:30:00.000Z",
                      userId: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", userName: "john_doe", email: "john@example.com" },
                      applications: [],
                      applicantsCount: 13,
                      milestonesCount: 3,
                      milestones: [
                        {
                          _id: "64fb0a1b2c3d4e5f6a7b8c9b",
                          timeFrame: { number: 7, period: "days" },
                          achievement: "Complete cabinet and chair repairs",
                          amount: 150000,
                          currency: "NGN",
                          status: "active",
                          paymentStatus: "unpaid",
                          dueDate: "2025-01-17T09:30:00.000Z",
                        },
                      ],
                    },
                    totalJobsPosted: 8,
                    totalArtisansHired: 5,
                    reviews: {
                      averageRating: 4.2,
                      numberOfRatings: 51,
                      ratingDistribution: { "5": 30, "4": 12, "3": 5, "2": 2, "1": 2 },
                      reviews: [
                        {
                          _id: "64fb1a1b2c3d4e5f6a7b8c9c",
                          rating: 5,
                          comment: "Great work, very professional.",
                          createdAt: "2025-01-05T09:30:00.000Z",
                          user: { _id: "64e1a2b3c4d5e6f7a8b9c0d1", firstName: "Jane", lastName: "Doe", displayImage: "https://.../avatar.jpg" },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Id required or job not found", content: { "application/json": { example: { message: "Id required!" } } } },
          "500": { description: "Server error" },
        },
      },
    },
    "/jobs/like-job/{jobId}": {
      post: {
        tags: ["Jobs"],
        summary: "Like a job",
        description: "Adds the job to the authenticated user's liked jobs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        responses: {
          "201": { description: "Job liked successfully", content: { "application/json": { example: { message: "success", data: { _id: "64fc0a1b2c3d4e5f6a7b8c9a", job: "64f5c0a1b2c3d4e5f6a7b8c9", user: "64e1a2b3c4d5e6f7a8b9c0d1" } } } } },
          "400": { description: "Job previously liked", content: { "application/json": { example: { message: "Job previously liked!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Job not found", content: { "application/json": { example: { message: "Job not found!" } } } },
        },
      },
    },
    "/jobs/fetch-liked-jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch liked jobs",
        description: "Returns a paginated list of jobs liked by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": { description: "Paginated list of liked jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, jobs: [] } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/unlike-job/{jobId}": {
      post: {
        tags: ["Jobs"],
        summary: "Unlike a job",
        description: "Removes the job from the authenticated user's liked jobs.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        responses: {
          "200": { description: "Job unliked", content: { "application/json": { example: { message: "success", data: { message: "Job unliked successfully" } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/apply-job": {
      post: {
        tags: ["Jobs"],
        summary: "Apply for a job",
        description: `Submits an application (project) for a pending job.

- \`type: biddable\`  → \`maximumPrice\` and \`milestones[]\` are required.
- \`type: regular\`   → those fields are forbidden.`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApplyJobPayload" },
              examples: {
                regular: {
                  summary: "Apply to a regular job",
                  value: {
                    jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                    businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                    type: "regular",
                  },
                },
                biddable: {
                  summary: "Apply to a biddable job with a price & milestones",
                  value: {
                    jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                    businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                    type: "biddable",
                    maximumPrice: 75000,
                    milestones: [
                      { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b", amount: 40000, achievement: "Replace sink and connect pipes" },
                      { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9c", amount: 35000, achievement: "Test and clean up" },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Application submitted",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    _id: "64fc0a1b2c3d4e5f6a7b8c9a",
                    job: "64f5c0a1b2c3d4e5f6a7b8c9",
                    user: "64e1a2b3c4d5e6f7a8b9c0d1",
                    creator: "64d1a2b3c4d5e6f7a8b9c0d1",
                    businessId: "64aa1b2c3d4e5f6a7b8c9ab",
                    status: "pending",
                  },
                },
              },
            },
          },
          "400": { description: "Bad request (e.g. applying to your own / non-pending job)", content: { "application/json": { example: { message: "You cannot apply to your own job!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Job or business not found" },
        },
      },
    },
    "/jobs/withdraw-job-application/{projectId}": {
      delete: {
        tags: ["Jobs"],
        summary: "Withdraw a job application",
        description: "Withdraws a pending application (project) submitted by the user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the application/project", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
        ],
        responses: {
          "200": { description: "Application withdrawn", content: { "application/json": { example: { message: "success", data: "Application withdrawn" } } } },
          "400": { description: "Can only withdraw a pending application", content: { "application/json": { example: { message: "You can only withdraw a pending application!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Application not found" },
        },
      },
    },
    "/jobs/delete-job/{jobId}": {
      delete: {
        tags: ["Jobs"],
        summary: "Delete a pending job",
        description: "Deletes a job created by the user. Only jobs with status `pending` can be deleted.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        responses: {
          "200": { description: "Job deleted", content: { "application/json": { example: { message: "success", data: "Job deleted successfully" } } } },
          "400": { description: "Only pending jobs can be deleted", content: { "application/json": { example: { message: "You can only delete a pending job!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/jobs/update-job/{jobId}": {
      put: {
        tags: ["Jobs"],
        summary: "Update a pending job",
        description: `Updates a job created by the user. Only jobs with status \`pending\` can be edited.

Send files (up to 10) under the \`files\` field; they are appended to the existing job files.
All body fields are optional. If \`jobUrgency\` is changed, old conditional fields are cleared.
Object/array fields may be sent as JSON strings in multipart form data; empty optional fields are ignored.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the job", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", properties: { files: { type: "array", items: { type: "string", format: "binary" }, description: "New files to append" }, title: { type: "string" }, description: { type: "string" }, jobUrgency: { type: "string", enum: ["right_now", "in_future", "regularly"] }, totalBudget: { type: "object", properties: { currency: { type: "string" }, amount: { type: "number" } } } } },
              encoding: { files: { contentType: "application/octet-stream" } },
              example: {
                title: "Fix leaking kitchen sink (updated)",
                description: "Updated description - need the work done by Friday.",
                jobUrgency: "right_now",
                jobDuration: { value: 2, unit: "days" },
                totalBudget: { currency: "NGN", amount: 90000 },
              },
            },
          },
        },
        responses: {
          "200": { description: "Job updated", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", title: "Fix leaking kitchen sink (updated)", status: "pending" } } } } },
          "400": { description: "Only pending jobs can be edited", content: { "application/json": { example: { message: "You can only edit a pending job!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/jobs/update-application-status/{projectId}": {
      patch: {
        tags: ["Jobs"],
        summary: "Update a job application status",
        description: `Allows the job creator to accept, reject, pause or unpause an application.

Allowed \`status\` values: \`pending\`, \`accepted\`, \`rejected\`, \`pause\`, \`unpause\`.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the application/project", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "accepted", "rejected", "pause", "unpause", "cancelled"] } } },
              example: { status: "accepted" },
            },
          },
        },
        responses: {
          "200": { description: "Application status updated", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", status: "active", acceptedApplicationId: "64fc0a1b2c3d4e5f6a7b8c9a" } } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Application or job not found" },
        },
      },
    },
    "/jobs/fetch-jobs-by-status": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch the user's jobs filtered by status",
        description: "Returns the current user's jobs filtered by `status`, enriched with milestone progress, due dates and overdue flags.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", required: true, schema: { type: "string", enum: ["pending", "completed", "active", "paused", "overdue"] }, description: "Job status to filter by", example: "active" },
        ],
        responses: {
          "200": {
            description: "Jobs matching the status",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: [
                    {
                      _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                      title: "Fix leaking kitchen sink",
                      status: "active",
                      milestoneProgress: "1/3",
                      overallDueDate: "2025-01-20T09:30:00.000Z",
                      currentMilestoneDueDate: "2025-01-13T09:30:00.000Z",
                      isOverdue: false,
                    },
                  ],
                },
              },
            },
          },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/remove-job/{jobId}/file/{fileId}": {
      delete: {
        tags: ["Jobs"],
        summary: "Remove a file from a job",
        description: "Removes a file attachment from a job using the file id.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
          { name: "fileId", in: "path", required: true, schema: { type: "string" }, description: "ObjectId of the file inside job.jobFiles", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
        ],
        responses: {
          "200": { description: "File removed", content: { "application/json": { example: { message: "success", data: "Image deleted successfully" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/jobs/accept-direct-job/{projectId}": {
      patch: {
        tags: ["Jobs"],
        summary: "Accept or reject a direct job",
        description: `The invited expert accepts or rejects a direct job.

- \`accepted\` → job becomes \`active\`, first milestone becomes \`active\`.
- \`rejected\` → job returns to \`pending\` and type becomes \`regular\`.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB ObjectId of the direct application/project", example: "64fc0a1b2c3d4e5f6a7b8c9a" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["status", "businessId"], properties: { status: { type: "string", enum: ["accepted", "rejected"] }, businessId: { type: "string" } } },
              example: { status: "accepted", businessId: "64aa1b2c3d4e5f6a7b8c9ab" },
            },
          },
        },
        responses: {
          "200": { description: "Status changed", content: { "application/json": { example: { message: "success", data: "Status changed successfully" } } } },
          "400": { description: "Unauthorized expert", content: { "application/json": { example: { message: "Unauthorized!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Application or job not found" },
        },
      },
    },
    "/jobs/fetch-applied-jobs-by-status": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch jobs the user has applied to (by status)",
        description: "Returns a paginated list of jobs the current user applied to, optionally filtered by application `status`.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", required: false, schema: { type: "string", enum: ["pending", "accepted", "rejected", "completed", "pause", "unpause", "cancelled"] }, description: "Application status filter", example: "pending" },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
          { name: "search", in: "query", required: false, schema: { type: "string" } },
          { name: "title", in: "query", required: false, schema: { type: "string" } },
          { name: "location", in: "query", required: false, schema: { type: "string" } },
          { name: "category", in: "query", required: false, schema: { type: "string" } },
          { name: "service", in: "query", required: false, schema: { type: "string" } },
        ],
        responses: {
          "200": { description: "Paginated list of applied jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, jobs: [] } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/fetch-applications-by-status": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch applications received on the user's jobs (by status)",
        description: "Returns a paginated list of applications/projects created on the user's jobs, optionally filtered by `status`.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", required: false, schema: { type: "string", enum: ["pending", "accepted", "rejected", "completed", "pause", "unpause", "cancelled"] }, example: "pending" },
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": { description: "Paginated list of applications", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, applications: [] } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/update-milestone-status/{jobId}/milestone/{milestoneId}": {
      patch: {
        tags: ["Jobs"],
        summary: "Update milestone status",
        description: `The assigned expert (project.user) updates the status of a milestone.

- \`completed\` activates the next milestone and, when all are complete, sets the job & project to \`completed\`.
- \`note\` / \`additionalAmount\` can be attached to the milestone invoice when completing.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
          { name: "milestoneId", in: "path", required: true, schema: { type: "string" }, example: "64fb0a1b2c3d4e5f6a7b8c9b" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "overdue", "completed", "active", "paused"] }, note: { type: "string" }, additionalAmount: { type: "number" } } },
              example: { status: "completed", note: "Work done and verified", additionalAmount: 5000 },
            },
          },
        },
        responses: {
          "200": { description: "Milestone updated - returns the full job", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", status: "active", milestones: [{ _id: "64fb0a1b2c3d4e5f6a7b8c9b", status: "completed", invoice: { note: "Work done and verified", additionalAmount: 5000, invoiceRaised: true } }] } } } } },
          "400": { description: "Cannot update a pending job milestone" },
          "401": { description: "Unauthorized" },
          "404": { description: "Job, application or milestone not found" },
        },
      },
    },
    "/jobs/request-for-quote/{jobId}": {
      patch: {
        tags: ["Jobs"],
        summary: "Request for a quote on a job",
        description: "The job creator requests a new quote from the accepted expert. Job must be `active` or `paused`. Sets `isRequestForQuote = true`.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        responses: {
          "200": { description: "Quote requested", content: { "application/json": { example: { message: "success", data: "Request for quote sent successfully" } } } },
          "400": { description: "Job must be active or paused", content: { "application/json": { example: { message: "You can only request for quote on an active or paused job!" } } } },
          "401": { description: "Unauthorized (creator only)" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/jobs/post-quote": {
      patch: {
        tags: ["Jobs"],
        summary: "Post a quote for a job",
        description: `The accepted expert posts a new quote after the creator requested one.

- Job must be \`active\` or \`paused\` and \`isRequestForQuote\` must be \`true\`.`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PostQuotePayload" },
              example: {
                jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                totalAmount: 95000,
                milestones: [
                  { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b", amount: 50000, achievement: "Replace sink and connect pipes" },
                  { milestoneId: "64fb0a1b2c3d4e5f6a7b8c9c", amount: 45000, achievement: "Test and clean up" },
                ],
              },
            },
          },
        },
        responses: {
          "200": { description: "Quote posted", content: { "application/json": { example: { message: "success", data: "Quote sent successfully" } } } },
          "400": { description: "Job must be active/paused and quote must be requested" },
          "401": { description: "Unauthorized (cannot quote on your own job)" },
          "404": { description: "Job or project not found" },
        },
      },
    },
    "/jobs/update-quote-status/{projectId}": {
      patch: {
        tags: ["Jobs"],
        summary: "Accept or reject a posted quote",
        description: `The job creator accepts or rejects a quote posted on one of their projects.

- \`accepted\` → job becomes \`active\`, milestone amounts are updated from the quote.
- \`rejected\` → records the rejection time.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "projectId", in: "path", required: true, schema: { type: "string" }, example: "64fc0a1b2c3d4e5f6a7b8c9a" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["pending", "accepted", "rejected"] } } },
              example: { status: "accepted" },
            },
          },
        },
        responses: {
          "200": { description: "Quote status updated", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", status: "active", budget: 95000 } } } } },
          "401": { description: "Unauthorized (creator only)" },
          "404": { description: "Application or job not found" },
        },
      },
    },
    "/jobs/update-milestone-payment": {
      patch: {
        tags: ["Jobs"],
        summary: "Record a milestone payment (with optional receipt)",
        description: `The job creator records that a milestone has been paid. Sends the receipt image under the \`image\` field and the other fields as form values.`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["amountPaid", "paymentMethod", "date", "jobId", "milestoneId"],
                properties: {
                  image: { type: "string", format: "binary", description: "Payment receipt image" },
                  amountPaid: { type: "number" },
                  paymentMethod: { type: "string", enum: ["Card", "BankTransfer", "Wallet"] },
                  date: { type: "string", example: "2025-01-12" },
                  jobId: { type: "string" },
                  milestoneId: { type: "string" },
                  note: { type: "string" },
                },
              },
              encoding: { image: { contentType: "application/octet-stream" } },
              example: {
                amountPaid: 50000,
                paymentMethod: "BankTransfer",
                date: "2025-01-12",
                jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b",
                note: "First milestone payment",
              },
            },
          },
        },
        responses: {
          "200": { description: "Milestone marked as paid", content: { "application/json": { example: { message: "success", data: { _id: "64f5c0a1b2c3d4e5f6a7b8c9", milestones: [{ _id: "64fb0a1b2c3d4e5f6a7b8c9b", paymentStatus: "paid", paymentInfo: { amountPaid: 50000, paymentMethod: "BankTransfer", date: "2025-01-12T00:00:00.000Z", note: "First milestone payment" } }] } } } } },
          "400": { description: "Unauthorized or missing ids" },
          "401": { description: "Unauthorized" },
          "404": { description: "Job or milestone not found" },
        },
      },
    },
    "/jobs/user-job-analytics": {
      get: {
        tags: ["Jobs"],
        summary: "Job analytics for the current user",
        description: "Returns job analytics (counts, totals, charts) for the authenticated user, optionally filtered by `year`, `month` or a date range.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "startDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-01-01" },
          { name: "endDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-12-31" },
          { name: "year", in: "query", required: false, schema: { type: "integer" }, example: 2025 },
          { name: "month", in: "query", required: false, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Job analytics", content: { "application/json": { example: { message: "success", data: { totalJobs: 5, activeJobs: 2, completedJobs: 1, pendingJobs: 2 } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/close-contract/{jobId}": {
      patch: {
        tags: ["Jobs"],
        summary: "Close a completed contract and leave a review",
        description: `Closes the contract for the job creator. All milestones must be \`completed\` and \`paid\`.

Leaves a review on the business that completed the job.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["rating"],
                properties: {
                  rating: { type: "number", enum: [1, 2, 3, 4, 5], example: 5 },
                  note: { type: "string", example: "Excellent work, very professional" },
                  rateCommunication: { type: "number", example: 5 },
                  isRecommendVendor: { type: "boolean", example: true },
                },
              },
              example: { rating: 5, note: "Excellent work, very professional", rateCommunication: 5, isRecommendVendor: true },
            },
          },
        },
        responses: {
          "200": { description: "Contract closed", content: { "application/json": { example: { message: "success", data: "Job closed successfully" } } } },
          "400": { description: "All milestones must be completed & paid / contract already closed" },
          "401": { description: "Unauthorized (creator only)" },
          "404": { description: "Job, project or business not found" },
        },
      },
    },
    "/jobs/fetch-job-count-creator": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch job counts for the job creator",
        description: "Returns counts of the current user's jobs grouped by status.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Job counts", content: { "application/json": { example: { message: "success", data: { pending: 2, active: 3, completed: 5, paused: 1, overdue: 0 } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/fetch-project-count": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch project (application) counts for the current user",
        description: "Returns counts of applications/projects for the authenticated user.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Project counts", content: { "application/json": { example: { message: "success", data: { pending: 4, accepted: 2, rejected: 1, completed: 3 } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/user-project-analytics": {
      get: {
        tags: ["Jobs"],
        summary: "Project analytics for the current user",
        description: "Returns project (application) analytics for the authenticated user, optionally filtered by `year`, `month` or a date range.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "startDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-01-01" },
          { name: "endDate", in: "query", required: false, schema: { type: "string", format: "date" }, example: "2025-12-31" },
          { name: "year", in: "query", required: false, schema: { type: "integer" }, example: 2025 },
          { name: "month", in: "query", required: false, schema: { type: "integer" }, example: 1 },
        ],
        responses: {
          "200": { description: "Project analytics", content: { "application/json": { example: { message: "success", data: { totalProjects: 10, accepted: 3, pending: 4, rejected: 3 } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/mute-job/{jobId}": {
      get: {
        tags: ["Jobs"],
        summary: "Mute a job",
        description: "Adds the job to the user's muted jobs so its notifications are hidden. You cannot mute your own job.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "jobId", in: "path", required: true, schema: { type: "string" }, example: "64f5c0a1b2c3d4e5f6a7b8c9" },
        ],
        responses: {
          "200": { description: "Job muted", content: { "application/json": { example: { message: "success", data: "Job muted successfully" } } } },
          "400": { description: "Cannot mute your own job", content: { "application/json": { example: { message: "You cannot mute your own job!" } } } },
          "401": { description: "Unauthorized" },
          "404": { description: "Job not found" },
        },
      },
    },
    "/jobs/pay-for-job": {
      post: {
        tags: ["Jobs"],
        summary: "Pay for a job milestone",
        description: `Initiates payment for a job milestone.

- \`paymentMethod\`: \`Card\`, \`BankTransfer\` or \`Wallet\`
- \`currency\`: \`NGN\`, \`USD\`, \`GBP\`, \`EUR\``,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PayForJobPayload" },
              example: {
                jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                milestoneId: "64fb0a1b2c3d4e5f6a7b8c9b",
                note: "Payment for milestone 1",
                paymentMethod: "Card",
                currency: "NGN",
                isAdditionalAmount: false,
                redirectUrl: "https://emilist.com/payment/callback",
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Payment initialized (returns payment link / authorization URL)",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    authorization_url: "https://checkout.paystack.com/xyz123",
                    reference: "c0a1b2c3d4e5f6a7b8c9",
                    access_code: "access_code_here",
                    message: "Payment initialized",
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Job or milestone not found" },
        },
      },
    },
    "/jobs/leads": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch job leads",
        description: `Returns job leads for the user's business. Requires an **active subscription** on a non-basic plan.`,
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": { description: "Paginated job leads", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, leads: [] } } } } },
          "400": { description: "No active subscription / basic plan", content: { "application/json": { example: { message: "You do not have an active subscription." } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/create-recurring-job": {
      post: {
        tags: ["Jobs"],
        summary: "Create a recurring job (maintenance plan)",
        description: `Creates a recurring/maintenance job.

- Provide \`jobId\` to convert an existing job, **or** supply the full job fields to create a new one.
- \`frequency\` accepts \`Weekly\`, \`Monthly\`, \`Quarterly\`.
- Files (up to 10) go under the \`files\` field.
Object/array fields (\`duration\`, \`milestones\`, \`reminderDates\`) may be sent as JSON strings in multipart form data; empty optional fields are ignored.`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/CreateRecurringJobPayload" },
              encoding: { files: { contentType: "application/octet-stream" } },
              example: {
                category: "Cleaning",
                service: "Janitorial",
                title: "Monthly office cleaning",
                description: "Full office cleaning every month.",
                duration: { number: 1, period: "months" },
                location: "14 Bourdillon Road, Ikoyi, Lagos",
                expertLevel: "three",
                milestones: [
                  { timeFrame: { number: 1, period: "months" }, achievement: "Full office deep clean", amount: 60000 },
                ],
                budget: 60000,
                achievementDetails: "Monthly maintenance",
                currency: "NGN",
                artisan: "clean_king",
                frequency: "Monthly",
                startDate: "2025-02-01",
                endDate: "2026-01-31",
                reminderDates: [{ day: "Monday" }],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Recurring job created",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    _id: "64fd0a1b2c3d4e5f6a7b8c9a",
                    jobId: "64f5c0a1b2c3d4e5f6a7b8c9",
                    frequency: "Monthly",
                    startDate: "2025-02-01T00:00:00.000Z",
                    endDate: "2026-01-31T00:00:00.000Z",
                    nextMaintenanceDate: "2025-03-01T00:00:00.000Z",
                    childJobs: [],
                    reminderDates: [{ day: "Monday" }],
                  },
                },
              },
            },
          },
          "400": { description: "Validation error" },
          "401": { description: "Unauthorized" },
          "404": { description: "Job or artisan user not found" },
        },
      },
    },
    "/jobs/fetch-recurring-jobs": {
      get: {
        tags: ["Jobs"],
        summary: "Fetch all recurring jobs for the current user",
        description: "Returns a paginated list of recurring jobs created by the authenticated user.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 10 } },
        ],
        responses: {
          "200": { description: "Paginated recurring jobs", content: { "application/json": { example: { message: "success", data: { page: 1, limit: 10, totalJobs: 1, jobs: [] } } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/jobs/create-job": {
      post: {
        tags: ["Jobs"],
        summary: "Create a new job",
        description: `Creates a job posted by the logged-in user.

**Urgency rules** (field \`jobUrgency\`):
- \`right_now\`   → requires \`jobDuration\` + \`totalBudget\`
- \`in_future\`   → requires \`jobSchedule\` + \`estimatedBudget\`
- \`regularly\`   → requires \`jobFrequency\`, \`startDate\`, \`recurringBudget\`

**Direct hire** ("Hire experts directly" flow): pass \`expertId\` set to the
target expert's Business \`uniqueId\`. This assigns the job straight to that
expert instead of publishing it for applications/bids:
- \`allowBidding\` and \`experienceLevel\` are not collected on this flow and
  become optional — the server forces \`allowBidding=false\`, \`type=direct\`,
  and \`isDirectHire=true\` regardless of what's sent.
- All other shared fields (\`jobCategory\`, \`service\`, \`title\`, \`description\`,
  \`jobUrgency\` + its conditional block, \`location\`) are still required.
- A \`Project\` (direct-job invitation) is auto-created with
  \`directJobStatus=pending\` and the expert is notified by email; the expert then
  accepts or rejects it via \`PATCH /jobs/accept-direct-job/{projectId}\`.
- Include at least one \`milestone\` so the job can be activated on acceptance.
- \`expertId\` must reference an existing Business; a 404 is returned otherwise.

Pick the job type from the **Examples** dropdown to get a payload with exactly the
required fields for that type. Two media types are supported:

- \`multipart/form-data\` — use this when uploading files (field \`files\`, up to 10).
  Object/array fields may be sent as JSON strings
  (e.g. \`location\` = \`{"address":"...","lat":6.4,"lng":3.4}\`); empty optional fields are ignored.
- \`application/json\` — same fields as real JSON (no file uploads).`,
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { $ref: "#/components/schemas/CreateJobPayload" },
              encoding: {
                files: { contentType: "application/octet-stream" },
              },
              examples: {
                right_now: {
                  summary: "Immediate job (right_now)",
                  value: {
                    jobCategory: "Plumbing",
                    service: "Repair",
                    title: "Fix leaking kitchen sink",
                    description: "Kitchen sink has been leaking for 2 days and needs urgent repair.",
                    jobUrgency: "right_now",
                    location: "{\"address\":\"12 Admiralty Way, Lekki, Lagos\",\"lat\":6.4281,\"lng\":3.4219}",
                    allowBidding: "true",
                    experienceLevel: "intermediate",
                    jobDuration: "{\"value\":3,\"unit\":\"days\"}",
                    totalBudget: "{\"currency\":\"NGN\",\"amount\":85000}",
                    milestones: "[{\"timeFrame\":{\"number\":3,\"period\":\"days\"},\"achievement\":\"Replace sink and connect pipes\",\"amount\":40000},{\"timeFrame\":{\"number\":2,\"period\":\"days\"},\"achievement\":\"Test and clean up\",\"amount\":45000}]",
                  },
                },
                in_future: {
                  summary: "Scheduled job (in_future)",
                  value: {
                    jobCategory: "Cleaning",
                    service: "Deep clean",
                    title: "Deep clean apartment before move-in",
                    description: "Full apartment deep clean scheduled ahead of move-in.",
                    jobUrgency: "in_future",
                    location: "{\"address\":\"4 Adeola Odeku, Victoria Island, Lagos\",\"lat\":6.4281,\"lng\":3.4219}",
                    allowBidding: "true",
                    experienceLevel: "junior",
                    jobSchedule: "{\"startDate\":\"2025-03-01\",\"endDate\":\"2025-03-07\"}",
                    estimatedBudget: "{\"currency\":\"NGN\",\"amount\":50000}",
                    milestones: "[{\"timeFrame\":{\"number\":7,\"period\":\"days\"},\"achievement\":\"Full deep clean\",\"amount\":30000},{\"timeFrame\":{\"number\":7,\"period\":\"days\"},\"achievement\":\"Final inspection\",\"amount\":20000}]",
                  },
                },
                regularly: {
                  summary: "Recurring job (regularly)",
                  value: {
                    jobCategory: "Gardening",
                    service: "Lawn mowing",
                    title: "Weekly lawn mowing",
                    description: "Mow the lawn every week for the next quarter.",
                    jobUrgency: "regularly",
                    location: "{\"address\":\"8 Bourdillon Road, Ikoyi, Lagos\",\"lat\":6.4478,\"lng\":3.4351}",
                    allowBidding: "false",
                    experienceLevel: "intermediate",
                    jobFrequency: "weekly",
                    startDate: "2025-02-01",
                    endDate: "2025-04-30",
                    recurringBudget: "{\"currency\":\"NGN\",\"amount\":15000,\"period\":\"weekly\"}",
                    milestones: "[{\"timeFrame\":{\"number\":1,\"period\":\"months\"},\"achievement\":\"First month of lawn mowing\",\"amount\":15000}]",
                  },
                },
                direct_hire: {
                  summary: "Direct hire (Hire experts directly)",
                  value: {
                    jobCategory: "Construction",
                    service: "Bricklayer",
                    title: "Hotel Janitorial Service Needed Urgently",
                    description: "Be as detailed as possible.",
                    jobUrgency: "regularly",
                    location: "{\"address\":\"112 General Ogomudia Lekki Phase 1, Lagos, Nigeria\"}",
                    expertId: "a1b2c3d4",
                    jobFrequency: "weekly",
                    startDate: "2025-02-01",
                    recurringBudget: "{\"currency\":\"NGN\",\"amount\":15000,\"period\":\"weekly\"}",
                    milestones: "[{\"timeFrame\":{\"number\":3,\"period\":\"weeks\"},\"achievement\":\"Lay bricks for foundation\",\"amount\":25000,\"currency\":\"NGN\"},{\"timeFrame\":{\"number\":2,\"period\":\"weeks\"},\"achievement\":\"Finish and inspect\",\"amount\":25000,\"currency\":\"NGN\"}]",
                  },
                },
              },
            },
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateJobPayload" },
              examples: {
                right_now: {
                  summary: "Immediate job (right_now)",
                  value: {
                    jobCategory: "Plumbing",
                    service: "Repair",
                    title: "Fix leaking kitchen sink",
                    description: "Kitchen sink has been leaking for 2 days and needs urgent repair.",
                    jobUrgency: "right_now",
                    location: { address: "12 Admiralty Way, Lekki, Lagos", lat: 6.4281, lng: 3.4219 },
                    allowBidding: true,
                    experienceLevel: "intermediate",
                    jobDuration: { value: 3, unit: "days" },
                    totalBudget: { currency: "NGN", amount: 85000 },
                    milestones: [
                      { timeFrame: { number: 3, period: "days" }, achievement: "Replace sink and connect pipes", amount: 40000 },
                      { timeFrame: { number: 2, period: "days" }, achievement: "Test and clean up", amount: 45000 },
                    ],
                  },
                },
                in_future: {
                  summary: "Scheduled job (in_future)",
                  value: {
                    jobCategory: "Cleaning",
                    service: "Deep clean",
                    title: "Deep clean apartment before move-in",
                    description: "Full apartment deep clean scheduled ahead of move-in.",
                    jobUrgency: "in_future",
                    location: { address: "4 Adeola Odeku, Victoria Island, Lagos", lat: 6.4281, lng: 3.4219 },
                    allowBidding: true,
                    experienceLevel: "junior",
                    jobSchedule: { startDate: "2025-03-01", endDate: "2025-03-07" },
                    estimatedBudget: { currency: "NGN", amount: 50000 },
                    milestones: [
                      { timeFrame: { number: 7, period: "days" }, achievement: "Full deep clean", amount: 30000 },
                      { timeFrame: { number: 7, period: "days" }, achievement: "Final inspection", amount: 20000 },
                    ],
                  },
                },
                regularly: {
                  summary: "Recurring job (regularly)",
                  value: {
                    jobCategory: "Gardening",
                    service: "Lawn mowing",
                    title: "Weekly lawn mowing",
                    description: "Mow the lawn every week for the next quarter.",
                    jobUrgency: "regularly",
                    location: { address: "8 Bourdillon Road, Ikoyi, Lagos", lat: 6.4478, lng: 3.4351 },
                    allowBidding: false,
                    experienceLevel: "intermediate",
                    jobFrequency: "weekly",
                    startDate: "2025-02-01",
                    endDate: "2025-04-30",
                    recurringBudget: { currency: "NGN", amount: 15000, period: "weekly" },
                    milestones: [
                      { timeFrame: { number: 1, period: "months" }, achievement: "First month of lawn mowing", amount: 15000 },
                    ],
                  },
                },
                direct_hire: {
                  summary: "Direct hire (Hire experts directly)",
                  value: {
                    jobCategory: "Construction",
                    service: "Bricklayer",
                    title: "Hotel Janitorial Service Needed Urgently",
                    description: "Be as detailed as possible.",
                    jobUrgency: "regularly",
                    location: { address: "112 General Ogomudia Lekki Phase 1, Lagos, Nigeria" },
                    expertId: "a1b2c3d4",
                    jobFrequency: "weekly",
                    startDate: "2025-02-01",
                    recurringBudget: { currency: "NGN", amount: 15000, period: "weekly" },
                    milestones: [
                      { timeFrame: { number: 3, period: "weeks" }, achievement: "Lay bricks for foundation", amount: 25000, currency: "NGN" },
                      { timeFrame: { number: 2, period: "weeks" }, achievement: "Finish and inspect", amount: 25000, currency: "NGN" },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Job created successfully",
            content: {
              "application/json": {
                example: {
                  message: "success",
                  data: {
                    _id: "64f5c0a1b2c3d4e5f6a7b8c9",
                    jobCategory: "Plumbing",
                    service: "Repair",
                    title: "Fix leaking kitchen sink",
                    description: "Kitchen sink has been leaking for 2 days and needs urgent repair.",
                    jobUrgency: "right_now",
                    location: { address: "12 Admiralty Way, Lekki, Lagos", lat: 6.4281, lng: 3.4219 },
                    allowBidding: true,
                    experienceLevel: "intermediate",
                    jobDuration: { value: 3, unit: "days" },
                    totalBudget: { currency: "NGN", amount: 85000 },
                    type: "regular",
                    status: "pending",
                    userId: "64e1a2b3c4d5e6f7a8b9c0d1",
                    applications: [],
                    createdAt: "2025-01-10T09:30:00.000Z",
                  },
                },
              },
            },
          },
          "400": { description: "Validation error (missing/forbidden fields)", content: { "application/json": { example: { errors: ["Job category is required"] } } } },
          "401": { description: "Unauthorized - missing or invalid token", content: { "application/json": { example: { message: "Kindly login" } } } },
          "500": { description: "Server error" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Paste the JWT returned by `POST /api/v1/auth/login`.",
      },
    },
    schemas: {
      Location: {
        type: "object",
        required: ["address"],
        properties: {
          address: { type: "string", example: "12 Admiralty Way, Lekki, Lagos" },
          lat: { type: "number", example: 6.4281 },
          lng: { type: "number", example: 3.4219 },
        },
      },
      Budget: {
        type: "object",
        required: ["currency", "amount"],
        properties: {
          currency: { type: "string", example: "NGN" },
          amount: { type: "number", example: 85000 },
        },
      },
      RecurringBudget: {
        type: "object",
        required: ["currency", "amount", "period"],
        properties: {
          currency: { type: "string", example: "NGN" },
          amount: { type: "number", example: 60000 },
          period: { type: "string", enum: ["weekly", "biweekly", "monthly"] },
        },
      },
      JobSchedule: {
        type: "object",
        required: ["startDate"],
        properties: {
          startDate: { type: "string", format: "date", example: "2025-02-01" },
          endDate: { type: "string", format: "date", example: "2025-02-28" },
        },
      },
      JobDuration: {
        type: "object",
        required: ["value", "unit"],
        properties: {
          value: { type: "number", example: 3 },
          unit: { type: "string", enum: ["hours", "days", "weeks", "months"], example: "days" },
        },
      },
      Milestone: {
        type: "object",
        properties: {
          _id: { type: "string", example: "64fb0a1b2c3d4e5f6a7b8c9b" },
          timeFrame: {
            type: "object",
            properties: {
              number: { type: "number", example: 5 },
              period: { type: "string", enum: ["days", "weeks", "months", "years"], example: "days" },
            },
          },
          achievement: { type: "string", example: "Replace sink and connect pipes" },
          amount: { type: "number", example: 40000 },
          status: { type: "string", enum: ["pending", "overdue", "completed", "active", "paused"], example: "pending" },
          paymentStatus: { type: "string", enum: ["paid", "processing", "unpaid", "canceled"], example: "unpaid" },
          paymentInfo: {
            type: "object",
            properties: {
              amountPaid: { type: "number" },
              paymentMethod: { type: "string", enum: ["Card", "BankTransfer", "Wallet"] },
              date: { type: "string", format: "date" },
              paymentReciept: { type: "string" },
              note: { type: "string" },
            },
          },
          datePaid: { type: "string", format: "date" },
          invoice: {
            type: "object",
            properties: {
              note: { type: "string" },
              additionalAmount: { type: "number", default: 0 },
              invoiceRaised: { type: "boolean", default: false },
            },
          },
        },
      },
      MilestoneInput: {
        type: "object",
        required: ["timeFrame", "achievement", "amount"],
        properties: {
          timeFrame: {
            type: "object",
            required: ["number", "period"],
            properties: {
              number: { type: "number", example: 5 },
              period: { type: "string", enum: ["days", "weeks", "months", "years"], example: "days" },
            },
          },
          achievement: { type: "string", example: "Replace sink and connect pipes" },
          amount: { type: "number", example: 40000 },
          currency: { type: "string", example: "NGN" },
        },
      },
      CreateJobPayload: {
        type: "object",
        required: ["jobCategory", "service", "title", "description", "jobUrgency", "location"],
        description: "`allowBidding` and `experienceLevel` are required unless `expertId` is set (direct hire), in which case they are ignored and forced by the server (`allowBidding=false`, `type=direct`).",
        properties: {
          files: { type: "array", items: { type: "string", format: "binary" }, description: "Job attachment files (up to 10)" },
          jobCategory: { type: "string", example: "Plumbing" },
          service: { type: "string", example: "Repair" },
          title: { type: "string", example: "Fix leaking kitchen sink" },
          description: { type: "string", example: "Kitchen sink has been leaking for 2 days." },
          jobUrgency: { type: "string", enum: ["right_now", "in_future", "regularly"], example: "right_now" },
          location: { $ref: "#/components/schemas/Location" },
          allowBidding: { type: "boolean", example: true, description: "Required unless expertId (direct hire) is set" },
          experienceLevel: { type: "string", enum: ["apprentice", "junior", "intermediate", "senior"], example: "intermediate", description: "Required unless expertId (direct hire) is set" },
          expertId: { type: "string", description: "Business uniqueId to directly assign this job to an expert (\"Hire experts directly\" flow). When set, allowBidding/experienceLevel are optional and the server forces allowBidding=false, type=direct, isDirectHire=true. Include at least one milestone so acceptance can activate it." },
          jobDuration: { $ref: "#/components/schemas/JobDuration", description: "Required when jobUrgency = right_now" },
          totalBudget: { $ref: "#/components/schemas/Budget", description: "Required when jobUrgency = right_now" },
          jobSchedule: { $ref: "#/components/schemas/JobSchedule", description: "Required when jobUrgency = in_future" },
          estimatedBudget: { $ref: "#/components/schemas/Budget", description: "Required when jobUrgency = in_future" },
          jobFrequency: { type: "string", enum: ["weekly", "biweekly", "monthly"], description: "Required when jobUrgency = regularly" },
          startDate: { type: "string", format: "date", description: "Required when jobUrgency = regularly" },
          endDate: { type: "string", format: "date" },
          recurringBudget: { $ref: "#/components/schemas/RecurringBudget", description: "Required when jobUrgency = regularly" },
          milestones: {
            type: "array",
            maxItems: 5,
            description: "Optional milestones — can be used with any jobUrgency, including direct hire via expertId (max 5). Each milestone requires a timeFrame (number + period), achievement and amount; currency is optional.",
            items: { $ref: "#/components/schemas/MilestoneInput" },
          },
        },
      },
      ApplyJobPayload: {
        type: "object",
        required: ["jobId", "businessId", "type"],
        properties: {
          jobId: { type: "string", example: "64f5c0a1b2c3d4e5f6a7b8c9" },
          businessId: { type: "string", example: "64aa1b2c3d4e5f6a7b8c9ab" },
          type: { type: "string", enum: ["biddable", "regular"], example: "regular" },
          maximumPrice: { type: "number", description: "Required when type = biddable", example: 75000 },
          milestones: {
            type: "array",
            description: "Required when type = biddable",
            items: {
              type: "object",
              required: ["milestoneId", "amount", "achievement"],
              properties: {
                milestoneId: { type: "string" },
                amount: { type: "number" },
                achievement: { type: "string" },
              },
            },
          },
        },
      },
      PostQuotePayload: {
        type: "object",
        required: ["jobId", "totalAmount", "milestones"],
        properties: {
          jobId: { type: "string" },
          totalAmount: { type: "number", example: 95000 },
          milestones: {
            type: "array",
            items: {
              type: "object",
              required: ["milestoneId", "amount", "achievement"],
              properties: {
                milestoneId: { type: "string" },
                amount: { type: "number" },
                achievement: { type: "string" },
              },
            },
          },
        },
      },
      PayForJobPayload: {
        type: "object",
        required: ["jobId", "milestoneId", "paymentMethod", "currency", "redirectUrl"],
        properties: {
          jobId: { type: "string" },
          milestoneId: { type: "string" },
          note: { type: "string" },
          paymentMethod: { type: "string", enum: ["Card", "BankTransfer", "Wallet"] },
          currency: { type: "string", enum: ["NGN", "USD", "GBP", "EUR"] },
          isAdditionalAmount: { type: "boolean" },
          redirectUrl: { type: "string", format: "uri" },
        },
      },
      CreateRecurringJobPayload: {
        type: "object",
        required: ["category", "service", "title", "description", "duration", "location", "expertLevel", "milestones", "budget", "frequency", "startDate", "endDate"],
        properties: {
          files: { type: "array", items: { type: "string", format: "binary" } },
          jobId: { type: "string", description: "Optional - convert an existing job into a recurring job" },
          category: { type: "string", example: "Cleaning" },
          service: { type: "string", example: "Janitorial" },
          title: { type: "string", example: "Monthly office cleaning" },
          description: { type: "string" },
          duration: {
            type: "object",
            required: ["number", "period"],
            properties: { number: { type: "number" }, period: { type: "string", enum: ["days", "weeks", "months", "years"] } },
          },
          location: { type: "string", example: "14 Bourdillon Road, Ikoyi, Lagos" },
          expertLevel: { type: "string", enum: ["one", "two", "three", "four"], example: "three" },
          milestones: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              required: ["timeFrame", "achievement", "amount"],
              properties: {
                timeFrame: { type: "object", properties: { number: { type: "number" }, period: { type: "string" } } },
                achievement: { type: "string" },
                amount: { type: "number" },
              },
            },
          },
          budget: { type: "number", example: 60000 },
          achievementDetails: { type: "string" },
          currency: { type: "string", example: "NGN" },
          artisan: { type: "string", description: "username/email of the artisan to assign", example: "clean_king" },
          frequency: { type: "string", enum: ["Weekly", "Monthly", "Quarterly"], example: "Monthly" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          reminderDates: { type: "array", items: { type: "object", properties: { day: { type: "string" } } } },
        },
      },
    },
  },
};
