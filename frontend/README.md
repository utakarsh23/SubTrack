# LeetCode-Style Submission Tracker Frontend

A Next.js application that provides a LeetCode-style interface for tracking coding problem submissions and progress.

## Features

✨ **LeetCode-Style UI**
- Dark theme matching LeetCode's visual design
- Responsive layout for desktop and tablet
- Smooth hover animations and transitions

📊 **Submission Management**
- Table view with Date, No., Question Name, Difficulty, Attempts, and Remarks
- Color-coded difficulty badges (Easy/Medium/Hard)
- Interactive checkboxes for tracking progress

🔍 **Detailed View Modal**
- Clickable question names open detailed popup (90% screen width)
- Question details with link to problem
- Duration, Attempts, and Approach tracking
- Editable Notes and Description fields
- Real-time remark updates

🚀 **API Integration**
- Connects to backend submission tracking API
- Real-time updates for checkbox interactions
- Pagination support for large datasets

## Tech Stack

- **Next.js 16** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Heroicons** for UI icons
- **React Compiler** enabled

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend API running (see backend folder)

### Installation

1. Clone and install dependencies:
```bash
cd frontend
npm install
```

2. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your API URL
```

3. Start development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## API Configuration

The frontend expects these backend endpoints:

- `GET /question/getSelf` - Fetch all submissions
- `GET /question/details/:submissionId` - Fetch single submission  
- `POST /question/update/:submissionId` - Update submission remarks/notes

Configure the API base URL in `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Project Structure

```
src/
├── app/
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Home page
├── components/
│   ├── SubmissionModal.tsx    # Detailed submission view
│   ├── SubmissionsPage.tsx    # Main page component
│   └── SubmissionTable.tsx    # Table component
├── lib/
│   ├── api.ts           # API client
│   └── utils.ts         # Utility functions
└── types/
    └── submission.ts    # TypeScript types
```

## Color Palette

Following LeetCode's design:
- **Easy**: `#00B8A3` (Green)
- **Medium**: `#FFB800` (Orange)  
- **Hard**: `#FF4D4F` (Red)
- **Background**: Dark grays (`#111827`, `#1f2937`, `#374151`)

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Contributing

1. Follow the existing code style
2. Ensure TypeScript compilation passes
3. Test responsiveness on different screen sizes
4. Maintain LeetCode-style visual consistency
