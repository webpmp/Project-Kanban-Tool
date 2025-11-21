# Gemini Kanban Pro

A powerful, AI-enhanced Kanban board application built with React, Tailwind CSS, and the Google Gemini API. This tool is designed to streamline workflows, improve team collaboration, and leverage generative AI for project management tasks.

## Features

### 🤖 AI-Powered Assistance
- **Smart Description Enhancement**: Use Gemini to rewrite and expand task descriptions professionally.
- **Subtask Generation**: Automatically generate concrete subtasks based on task titles.
- **AI Project Assistant**: A built-in chat agent that has visibility into your board, team, and deadlines to answer questions and provide summaries.

### 📊 Project Views
- **Kanban Board**:
  - Drag-and-drop interface.
  - Customizable swimlanes (Backlog, Discover, Define, Concept, Design, Implementation).
  - Filter and sort by Priority, Due Date, or Assignee.
- **Gantt Chart**:
  - Visual timeline for project scheduling.
  - Zoom controls and "Fit to Screen" functionality.
  - Dependency visualization.
- **Project Overview**:
  - High-level dashboard showing project health, milestones, and documentation links.
  - Team summary and recent status updates.

### 👥 Team & Collaboration
- **Team Management**: Invite, edit, and remove team members.
- **Role-Based Access**: Support for Admin, Member, and Viewer roles.
- **Status Updates**: Post Daily, Weekly, or Ad-hoc updates with rich commenting capabilities.
- **Discussion**: Per-task comment threads for focused communication.

### 🎨 Customization
- **Themes**: Choose from multiple color themes (Default, Nature, Sunset, Ocean, Midnight).
- **Project Identity**: Custom project name, description, and logo/icon.

## Tech Stack

- **Framework**: React 19 (TypeScript)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI Integration**: Google GenAI SDK (`@google/genai`)
- **Model**: Gemini 2.5 Flash

## Setup & Installation

1. **Environment Setup**
   Ensure you have a valid Google Gemini API Key.

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Application**
   ```bash
   npm start
   ```

## Usage Guide

### Configuring AI
The application uses `process.env.API_KEY` to authenticate with Google's GenAI. Ensure this environment variable is set in your runtime environment.

### Task Management
- Click **New Task** to create a Task or Epic.
- **Epics** can contain multiple child tasks and are highlighted in the Gantt view.
- Use the **Enhance** button in the task modal to polish your writing using AI.

### Swimlanes
- Admins can add, rename, or delete swimlanes directly from the board header.
- Drag tasks between lanes to update their phase.

## License

This project is open source.
