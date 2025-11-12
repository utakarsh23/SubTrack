# LeetCode-Style Submission Tracker Frontend

This project is a Next.js application that creates a LeetCode-style interface for tracking coding submissions.

## Project Requirements
- Next.js with TypeScript and Tailwind CSS
- LeetCode-style dark theme UI
- Submission table with columns: Date, No., Question Name, Difficulty, Attempts, Remarks
- Modal popup for detailed submission view
- API integration with backend endpoints
- Responsive design for desktop and tablet

## API Endpoints Used
- GET /question/getSelf - fetch all submissions
- GET /question/details/:submissionId - fetch single submission  
- POST /question/update/:submissionId - update submission remarks/notes

## Features
- Dark theme matching LeetCode's visual design
- Clickable question names that open detailed modals
- Color-coded difficulty badges (Easy/Medium/Hard)
- Interactive checkboxes for remarks (Could Do Better, Need Working On, Saw Solution)
- Real-time API updates for checkbox interactions
- Responsive layout with hover animations and smooth transitions

## Development
- Development server running on http://localhost:3000
- Backend API expected on http://localhost:3001
- Uses Tailwind CSS for styling with custom LeetCode-inspired theme
- TypeScript for type safety and better development experience