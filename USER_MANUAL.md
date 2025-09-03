# Care Echo User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Survey System](#survey-system)
5. [Admin Panel](#admin-panel)
6. [Analytics Dashboard](#analytics-dashboard)
7. [Troubleshooting](#troubleshooting)

---

## Introduction

Care Echo is a healthcare-focused survey platform designed to support healthcare workers' well-being through intelligent check-ins and comprehensive analytics.

### Key Features
- **Shift Check-ins**: Start and end-of-shift surveys with intelligent responses
- **Multi-role Support**: Admin, Manager, Agency, and User roles
- **Analytics Dashboard**: Comprehensive data visualization
- **User Management**: Bulk user import and individual creation
- **Agency Management**: Multi-agency support

---

## Getting Started

### First Time Setup
1. Navigate to your Care Echo URL
2. Login with your provided email and password
3. Complete your profile information

### Navigation
- **Header**: Navigation links and user dropdown
- **Main Content**: Changes based on your role
- **User Dropdown**: Profile info and logout

---

## User Roles & Permissions

### Admin Users
- Create and manage all users and agencies
- Access all analytics data
- Bulk import users
- Full system access

### Manager Users
- Create users for assigned agencies only
- View analytics for assigned agencies
- Multi-agency management
- Agency filter in analytics

### Agency Users
- Create users for their agency only
- View analytics for their agency
- Single agency management

### Regular Users
- Take Start and End Shift surveys
- Must be associated with an agency
- Cannot access admin panel or analytics

---

## Survey System

### Survey Types

#### Start Shift Survey
**Questions**:
1. **Mood Check** (Emoji Scale)
   - 😃 Great, 🙂 Okay, 😐 Tired, 😔 Stressed, 😢 Overwhelmed

2. **Main Concern** (Multiple Choice)
   - Resident grief or decline
   - Family conflict
   - Workload / understaffing
   - Supervisor or leadership issues
   - Personal / outside stress
   - Other (with text input)

3. **Support & Energy** (Optional Text)
   - What might help you feel supported or energized this shift?

#### End Shift Survey
**Questions**:
1. **Mood Check** (Same options as Start)

2. **Main Stress Source** (Multiple Choice)
   - Same options as Start

3. **Support & Energy** (Optional Text)
   - What gave you energy or support today?

### Taking Surveys

#### Prerequisites
- Must be logged in
- Must be associated with an agency (except admins)

#### Steps
1. Click "Start Shift Check-In" or "End Shift Check-In" in header
2. Answer each question thoughtfully
3. Read the intelligent response generated
4. Click "Submit Survey" to save

---

## Admin Panel

### Access
- **Admin Users**: Full access
- **Manager Users**: Agency-scoped access
- **Agency Users**: Single agency access
- **Regular Users**: No access

### User Management

#### Create Individual Users
1. Click "Create User" button
2. Fill required fields:
   - Full Name, Email, Password
   - Role (Admin/Manager/Agency/User)
   - Agency assignment
3. Click "Create User"

#### Bulk Import Users
1. Click "Bulk Import" button
2. Prepare CSV with headers:
   - `displayName`, `email`, `password`, `agency`
3. Paste CSV content
4. Click "Import"

#### Edit Users
1. Click "Edit" button next to user
2. Modify fields as needed
3. Toggle Active/Inactive status
4. Send password reset email
5. Save changes

### Agency Management

#### Create Agency
1. Click "Create Agency" button
2. Enter agency name
3. Click "Create Agency"

#### View Agency Details
- Agency name and user count
- Creation date
- Edit/Delete options

---

## Analytics Dashboard

### Access
- **Admin Users**: All data access
- **Manager Users**: Assigned agencies' data
- **Agency Users**: Their agency's data
- **Regular Users**: No access

### Dashboard Components

#### Overview Cards
- Total Responses
- Start/End Shift counts
- Average Mood score

#### Charts
- **Mood Distribution**: Bar chart of mood responses
- **Main Concerns**: Pie chart of concerns
- **Response Trends**: Line chart over time
- **Support & Energy**: Word cloud and categorized analysis

#### Recent Responses
- Latest survey submissions
- User details and responses

### Filters
- **Time**: 7 days, 30 days, all time
- **Survey Type**: All, Start, End
- **Agency**: Dropdown (admin/manager only)

---

## Troubleshooting

### Common Issues

#### Login Problems
- Check email and password
- Ensure account is active
- Try password reset

#### Survey Access Issues
- Ensure you're logged in
- Check agency association
- Verify internet connection

#### Analytics Not Loading
- Check date filters
- Verify agency selection
- Refresh page

#### User Creation Errors
- Verify permissions for your role
- Check agency assignments
- Ensure all required fields are filled

### Error Messages

#### "Agency Association Required"
- Contact admin to assign agency

#### "Missing or Insufficient Permissions"
- Contact admin to adjust permissions

#### "Failed to Create User"
- Check form data and try again

### Getting Help
1. Check this manual for solutions
2. Contact your admin for role-specific issues
3. Document error messages when reporting

---

## Best Practices

### For Survey Participants
- Complete surveys honestly
- Take surveys consistently
- Use "Other" thoughtfully
- Read reflections carefully

### For Agency Users
- Regular user management
- Monitor analytics
- Support staff based on data
- Communicate findings

### For Manager Users
- Multi-agency coordination
- Use agency filters
- Create users only for assigned agencies
- Look for patterns across agencies

### For Admin Users
- Regular system maintenance
- Use bulk operations efficiently
- Assign appropriate permissions
- Monitor system-wide trends

---

*Last Updated: [Current Date]*
*Version: 1.0*
